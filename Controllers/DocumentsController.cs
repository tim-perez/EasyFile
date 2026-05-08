using System.IO;
using System.Threading.Tasks;
using System.IO.Compression;
using System.Security.Claims;
using System.Text.Json;
using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using EasyFile.Data;
using EasyFile.Interfaces;
using EasyFile.Models.DTOs;
using EasyFile.Models.Pagination;
using EasyFile.Services; 
using Microsoft.AspNetCore.RateLimiting;

namespace EasyFile.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DocumentsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly IDocumentService _documentService;
        private readonly ITextractService _textractService;
        private readonly IAiReviewService _aiReviewService;
        private readonly IPdfReportService _pdfReportService;
        private readonly IPdfProcessingService _pdfProcessingService;
        private readonly ILogger<DocumentsController> _logger;
        private readonly IMapper _mapper;

        public DocumentsController(
            AppDbContext dbContext,
            IDocumentService documentService,
            ITextractService textractService,
            IAiReviewService aiReviewService,
            IPdfReportService pdfReportService,
            IPdfProcessingService pdfProcessingService,
            ILogger<DocumentsController> logger,
            IMapper mapper)
        {
            _dbContext = dbContext;
            _documentService = documentService;
            _textractService = textractService;
            _aiReviewService = aiReviewService;
            _pdfReportService = pdfReportService;
            _pdfProcessingService = pdfProcessingService; 
            _logger = logger;
            _mapper = mapper;
        }

        [HttpPost("upload")]
        [EnableRateLimiting("UploadPolicy")]
        public async Task<IActionResult> UploadDocument([FromForm] string userId)
        {
            var uploadedKeys = new List<string>();
            try
            {
                var files = Request.Form.Files.ToList();
                if (files.Count == 0 || files.Any(file => file.Length == 0)) return BadRequest(new { message = "No file uploaded." });
                if (!int.TryParse(userId, out int parsedUserId)) return BadRequest(new { message = "Invalid user ID." });

                const long maxFileSize = 25 * 1024 * 1024;
                var invalidFile = files.FirstOrDefault(file =>
                    !string.Equals(file.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase) ||
                    !Path.GetExtension(file.FileName).Equals(".pdf", StringComparison.OrdinalIgnoreCase));
                if (invalidFile != null) return BadRequest(new { message = "Upload Failed: EasyFile only accepts PDF legal documents." });

                var oversizedFile = files.FirstOrDefault(file => file.Length > maxFileSize);
                if (oversizedFile != null) return BadRequest(new { message = $"Upload Failed: {oversizedFile.FileName} is too large. Maximum file size is 25 MB." });

                var userRecord = await _dbContext.Users.FindAsync(parsedUserId);
                if (userRecord != null && userRecord.AccountType == "Guest")
                {
                    var currentDocCount = await _dbContext.Documents.CountAsync(d => d.UploaderId == userRecord.Id);
                    if (currentDocCount + files.Count > 5) return StatusCode(403, new { message = "Guest limit reached." });
                }

                var submission = new EasyFile.Models.Submission
                {
                    UploaderId = parsedUserId,
                    SubmissionNumber = await GenerateSubmissionNumberAsync()
                };

                foreach (var file in files)
                {
                    var originalFileName = file.FileName;
                    var fileKey = await _documentService.UploadDocumentAsync(file, userId);
                    uploadedKeys.Add(fileKey);

                    string extractedText;
                    using (var fullFileStream = file.OpenReadStream())
                    {
                        try 
                        {
                            using var firstPageStream = _pdfProcessingService.ExtractFirstPage(fullFileStream);
                            
                            extractedText = await _textractService.ExtractTextAsync(firstPageStream);
                        }
                        catch (Exception pdfEx)
                        {
                            _logger.LogError(pdfEx, "Failed to extract the first page from {FileName}", originalFileName);
                            await DeleteUploadedKeysAsync(uploadedKeys);
                            return BadRequest(new { message = $"Upload Failed: Could not process the PDF structure of {originalFileName}." });
                        }
                    }

                    if (string.IsNullOrWhiteSpace(extractedText) || extractedText.Length < 50)
                    {
                        await DeleteUploadedKeysAsync(uploadedKeys);
                        return BadRequest(new { message = $"Upload Failed: {originalFileName} could not be read as a text-searchable legal PDF." });
                    }

                    var aiReportJson = await _aiReviewService.GenerateDocumentReportAsync(extractedText);
                    
                    var aiReportDto = JsonSerializer.Deserialize<AiDocumentReportDto>(aiReportJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) 
                                      ?? new AiDocumentReportDto();

                    if (aiReportDto.Status == "REJECT_NON_LEGAL_DOCUMENT")
                    {
                        await DeleteUploadedKeysAsync(uploadedKeys);
                        return BadRequest(new { message = $"Upload Failed: {originalFileName} is not recognized as a legal document." });
                    }

                    var newDocument = _mapper.Map<EasyFile.Models.Document>(aiReportDto);
                    newDocument.UploaderId = parsedUserId;
                    newDocument.FileName = originalFileName ?? "Unknown_File.pdf";
                    newDocument.FileUrl = fileKey ?? "Missing_URL";
                    newDocument.FileType = file.ContentType ?? "application/pdf";
                    newDocument.Submission = submission;
                    submission.Documents.Add(newDocument);
                }

                ApplySubmissionSummary(submission);

                _dbContext.Submissions.Add(submission);
                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "Submission and AI analysis complete!", submissionId = submission.Id, submissionNumber = submission.SubmissionNumber });
            }
            catch (Exception ex)
            {
                await DeleteUploadedKeysAsync(uploadedKeys);
                _logger.LogError(ex, "Error processing document upload.");
                return StatusCode(500, new { message = "An error occurred.", error = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetDocuments([FromQuery] DocumentQueryParameters queryParams)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var query = _dbContext.Documents.Where(d => d.Recycled == false);

                // 1. Role-based filtering
                if (userRole != "Admin") query = query.Where(d => d.UploaderId == userId);

                // 2. Apply Server-Side Filters
                if (!string.IsNullOrWhiteSpace(queryParams.SearchTerm))
                {
                    var search = queryParams.SearchTerm.ToLower();
                    query = query.Where(d => 
                        (d.FileName != null && d.FileName.ToLower().Contains(search)) ||
                        (d.DocumentTitle != null && d.DocumentTitle.ToLower().Contains(search)) ||
                        (d.CaseNumber != null && d.CaseNumber.ToLower().Contains(search)) ||
                        (d.County != null && d.County.ToLower().Contains(search)) ||
                        (d.Submission != null && d.Submission.SubmissionNumber.ToLower().Contains(search)));
                }

                if (!string.IsNullOrWhiteSpace(queryParams.DocumentTitle))
                    query = query.Where(d => d.DocumentTitle == queryParams.DocumentTitle);
                if (!string.IsNullOrWhiteSpace(queryParams.CaseNumber))
                    query = query.Where(d => d.CaseNumber == queryParams.CaseNumber);
                if (!string.IsNullOrWhiteSpace(queryParams.County))
                    query = query.Where(d => d.County == queryParams.County);
                if (!string.IsNullOrWhiteSpace(queryParams.Status))
                    query = query.Where(d => d.Status == queryParams.Status);
                if (!string.IsNullOrWhiteSpace(queryParams.SuggestedType))
                {
                    var suggestedType = queryParams.SuggestedType;
                    query = query.Where(d =>
                        d.EFilingDocType == suggestedType ||
                        d.DocumentTitle == suggestedType ||
                        d.SuggestedDocumentTypes == suggestedType ||
                        d.SuggestedDocumentTypes.StartsWith(suggestedType + "|") ||
                        d.SuggestedDocumentTypes.Contains("|" + suggestedType + "|") ||
                        d.SuggestedDocumentTypes.EndsWith("|" + suggestedType));
                }
                if (!string.IsNullOrWhiteSpace(queryParams.Prediction))
                    query = query.Where(d => d.Prediction == queryParams.Prediction);
                if (queryParams.Fee.HasValue)
                    query = query.Where(d => d.DocumentFee == queryParams.Fee.Value);

                // 3. Count total records BEFORE paginating (needed for the frontend UI)
                var totalCount = await query.CountAsync();

                // 4. Apply Server-Side Sorting
                bool isDesc = queryParams.SortDirection?.ToLower() == "desc";
                query = queryParams.SortColumn?.ToLower() switch
                {
                    "filename" => isDesc ? query.OrderByDescending(d => d.FileName) : query.OrderBy(d => d.FileName),
                    "documenttitle" => isDesc ? query.OrderByDescending(d => d.DocumentTitle) : query.OrderBy(d => d.DocumentTitle),
                    "suggesteddocumenttypes" => isDesc ? query.OrderByDescending(d => d.SuggestedDocumentTypes) : query.OrderBy(d => d.SuggestedDocumentTypes),
                    "submissionnumber" => isDesc ? query.OrderByDescending(d => d.Submission!.SubmissionNumber) : query.OrderBy(d => d.Submission!.SubmissionNumber),
                    "prediction" => isDesc ? query.OrderByDescending(d => d.Prediction) : query.OrderBy(d => d.Prediction),
                    "documentfee" => isDesc ? query.OrderByDescending(d => d.DocumentFee) : query.OrderBy(d => d.DocumentFee),
                    "casenumber" => isDesc ? query.OrderByDescending(d => d.CaseNumber) : query.OrderBy(d => d.CaseNumber),
                    "county" => isDesc ? query.OrderByDescending(d => d.County) : query.OrderBy(d => d.County),
                    "status" => isDesc ? query.OrderByDescending(d => d.Status) : query.OrderBy(d => d.Status),
                    _ => isDesc ? query.OrderByDescending(d => d.CreatedAt) : query.OrderBy(d => d.CreatedAt) // Default is Date
                };

                // 5. Apply Server-Side Pagination
                var documents = await query
                    .Include(d => d.Submission)
                    .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                    .Take(queryParams.PageSize)
                    .ToListAsync();

                // 6. Return the standard wrapper
                var result = new PagedResult<EasyFile.Models.Document>
                {
                    Items = documents,
                    TotalCount = totalCount,
                    PageNumber = queryParams.PageNumber,
                    PageSize = queryParams.PageSize
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch paginated documents.");
                return StatusCode(500, new { message = "Failed to fetch documents." });
            }
        }

        [HttpGet("{id}/url")]
        public async Task<IActionResult> GetDocumentUrl(int id)
        {
            try
            {
                var doc = await _dbContext.Documents.FindAsync(id);
                if (doc == null) return NotFound(new { message = "Document not found." });

                var url = await _documentService.GetDocumentPresignedUrlAsync(doc.FileUrl);
                return Ok(new { url });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not generate presigned URL for document {Id}.", id);
                return StatusCode(500, new { message = "Could not generate link." });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            try
            {
                var doc = await _dbContext.Documents.FindAsync(id);
                if (doc == null) return NotFound(new { message = "Document not found." });

                doc.Recycled = true;
                doc.DeletedAt = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();
                return Ok(new { message = "Document moved to recycle bin." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to soft-delete document {Id}.", id);
                return StatusCode(500, new { message = "Failed to delete document." });
            }
        }

        [HttpGet("recycle")]
        public async Task<IActionResult> GetRecycledDocuments()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var query = _dbContext.Documents.Where(d => d.Recycled == true);

                if (userRole != "Admin") query = query.Where(d => d.UploaderId == userId);

                var documents = await query.Include(d => d.Submission).OrderByDescending(d => d.DeletedAt).ToListAsync();
                return Ok(documents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch recycled documents.");
                return StatusCode(500, new { message = "Failed to fetch recycled documents." });
            }
        }

        [HttpPost("{id}/restore")]
        public async Task<IActionResult> RestoreDocument(int id)
        {
            try
            {
                var doc = await _dbContext.Documents.FindAsync(id);
                if (doc == null) return NotFound(new { message = "Document not found." });

                doc.Recycled = false;
                doc.DeletedAt = null;

                await _dbContext.SaveChangesAsync();
                return Ok(new { message = "Document restored successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to restore document {Id}.", id);
                return StatusCode(500, new { message = "Failed to restore document." });
            }
        }

        private async Task<string> GenerateSubmissionNumberAsync()
        {
            var random = new Random();
            for (var attempt = 0; attempt < 25; attempt++)
            {
                var candidate = random.Next(0, 10000).ToString("D4", CultureInfo.InvariantCulture);
                if (!await _dbContext.Submissions.AnyAsync(s => s.SubmissionNumber == candidate)) return candidate;
            }

            var count = await _dbContext.Submissions.CountAsync();
            return (count % 10000).ToString("D4", CultureInfo.InvariantCulture);
        }

        private async Task DeleteUploadedKeysAsync(IEnumerable<string> fileKeys)
        {
            foreach (var fileKey in fileKeys.Distinct().Where(key => !string.IsNullOrWhiteSpace(key)))
            {
                try { await _documentService.DeleteDocumentAsync(fileKey); }
                catch (Exception ex) { _logger.LogWarning(ex, "Failed to clean up uploaded file {FileKey}.", fileKey); }
            }
        }

        private static void ApplySubmissionSummary(EasyFile.Models.Submission submission)
        {
            var documents = submission.Documents.ToList();
            submission.County = FirstKnown(documents.Select(d => d.County), "Unknown");
            submission.CaseNumber = FirstKnown(documents.Select(d => d.CaseNumber), "Not Yet Assigned", "Missing", "");
            submission.FilingType = submission.CaseNumber == "Not Yet Assigned" ? "Case Initiation" : "Subsequent";
            submission.CaseTitle = FirstKnown(documents.Select(d => d.CaseTitle), "Unknown");
            submission.CaseCategory = FirstKnown(documents.Select(d => d.CaseCategory), "Unknown");
            submission.CaseType = FirstKnown(documents.Select(d => d.CaseType), "Unknown");
            submission.PlaintiffsOrPetitioners = FirstKnown(documents.Select(d => d.FiledBy), "Unknown");
            submission.DefendantsOrRespondents = FirstKnown(documents.Select(d => d.RefersTo), "Unknown");
            submission.Attorneys = FirstKnown(documents.Select(d => d.Representation), "None", "Self-Represented");
            submission.TotalCourtFees = documents.Sum(d => d.DocumentFee);

            var accepted = documents.Count(d => string.Equals(d.Prediction, "Accepted", StringComparison.OrdinalIgnoreCase));
            var rejected = documents.Count(d => string.Equals(d.Prediction, "Rejected", StringComparison.OrdinalIgnoreCase));
            submission.Summary = $"{accepted}/{documents.Count} document(s) likely to be accepted. {rejected}/{documents.Count} document(s) likely to be rejected.";
        }

        private static string FirstKnown(IEnumerable<string?> values, string fallback, params string[] alsoUnknown)
        {
            var unknown = new HashSet<string>(alsoUnknown.Append("Unknown").Append("Processing..."), StringComparer.OrdinalIgnoreCase);
            return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value) && !unknown.Contains(value.Trim()))?.Trim() ?? fallback;
        }

        [HttpDelete("{id}/permanent")]
        public async Task<IActionResult> HardDeleteDocument(int id)
        {
            try
            {
                var doc = await _dbContext.Documents.FindAsync(id);
                if (doc == null) return NotFound(new { message = "Document not found." });

                try { await _documentService.DeleteDocumentAsync(doc.FileUrl); }
                catch (Exception s3Ex) { _logger.LogWarning(s3Ex, "S3 Delete Warning for document {Id}.", id); }

                _dbContext.Documents.Remove(doc);
                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "Document permanently deleted." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to permanently delete document {Id}.", id);
                return StatusCode(500, new { message = "Failed to permanently delete." });
            }
        }

        [HttpGet("{id}/report/download")]
        public async Task<IActionResult> DownloadReport(int id)
        {
            try
            {
                var document = await _dbContext.Documents.FindAsync(id);
                if (document == null) return NotFound(new { message = "Document not found." });

                var pdfBytes = _pdfReportService.GenerateReport(document);
                var sanitizedFileName = $"{document.FileName ?? "Legal_Document"}_AI_Report.pdf";
                
                return File(pdfBytes, "application/pdf", sanitizedFileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate PDF report for document {Id}.", id);
                return StatusCode(500, new { message = "Failed to generate PDF report." });
            }
        }

        [HttpPut("bulk-edit")]
        public async Task<IActionResult> BulkEditDocuments([FromBody] BulkEditRequest request)
        {
            try
            {
                var documents = await _dbContext.Documents
                    .Where(d => request.DocumentIds.Contains(d.Id) && d.Recycled == false)
                    .ToListAsync();

                if (!documents.Any()) return NotFound(new { message = "None of the selected documents were found." });

                foreach (var doc in documents)
                {
                    _mapper.Map(request, doc);
                }

                await _dbContext.SaveChangesAsync();
                return Ok(new { message = $"Successfully updated {documents.Count} document(s)." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to bulk update documents.");
                return StatusCode(500, new { message = "Failed to update documents." });
            }
        }

        [HttpPost("bulk-download/reports")]
        public async Task<IActionResult> BulkDownloadReports([FromBody] BulkDownloadRequest request)
        {
            try
            {
                var documents = await _dbContext.Documents
                    .Where(d => request.DocumentIds.Contains(d.Id) && d.Recycled == false)
                    .ToListAsync();

                if (!documents.Any()) return NotFound(new { message = "No documents found." });

                using var memoryStream = new MemoryStream();
                using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                {
                    foreach (var doc in documents)
                    {
                        var pdfBytes = _pdfReportService.GenerateReport(doc); 
                        var safeName = $"{doc.FileName ?? "Document"}_Report.pdf";
                        
                        var zipEntry = archive.CreateEntry(safeName, CompressionLevel.Fastest);
                        using var zipStream = zipEntry.Open();
                        zipStream.Write(pdfBytes, 0, pdfBytes.Length);
                    }
                }

                memoryStream.Seek(0, SeekOrigin.Begin);
                return File(memoryStream.ToArray(), "application/zip", "EasyFile_Reports.zip");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate reports zip.");
                return StatusCode(500, new { message = "Failed to generate reports zip." });
            }
        }

        [HttpPost("bulk-download/files")]
        public async Task<IActionResult> BulkDownloadOriginalFiles([FromBody] BulkDownloadRequest request)
        {
            try
            {
                var documents = await _dbContext.Documents
                    .Where(d => request.DocumentIds.Contains(d.Id) && d.Recycled == false)
                    .ToListAsync();

                if (!documents.Any()) return NotFound(new { message = "No documents found." });

                using var memoryStream = new MemoryStream();
                using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                {
                    using var httpClient = new HttpClient();

                    foreach (var doc in documents)
                    {
                        try 
                        {
                            var url = await _documentService.GetDocumentPresignedUrlAsync(doc.FileUrl);
                            var fileBytes = await httpClient.GetByteArrayAsync(url);
                            
                            var safeName = doc.FileName ?? $"Unknown_Document_{doc.Id}.pdf";
                            var zipEntry = archive.CreateEntry(safeName, CompressionLevel.Fastest);
                            using var zipStream = zipEntry.Open();
                            zipStream.Write(fileBytes, 0, fileBytes.Length);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to fetch {FileName} from S3 during bulk download.", doc.FileName);
                        }
                    }
                }

                memoryStream.Seek(0, SeekOrigin.Begin);
                return File(memoryStream.ToArray(), "application/zip", "EasyFile_Originals.zip");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to zip original files.");
                return StatusCode(500, new { message = "Failed to zip original files." });
            }
        }

        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var query = _dbContext.Documents.Where(d => d.Recycled == false);

                if (userRole != "Admin") query = query.Where(d => d.UploaderId == userId);

                var totalDocuments = await query.CountAsync();
                var accepted = await query.CountAsync(d => d.Prediction == "Accepted");
                var rejected = await query.CountAsync(d => d.Prediction == "Rejected");
                var totalSubmissions = await _dbContext.Submissions
                    .Where(s => s.Recycled == false && (userRole == "Admin" || s.UploaderId == userId))
                    .CountAsync();

                var topCounties = await query
                    .Where(d => d.County != "Unknown" && !string.IsNullOrEmpty(d.County))
                    .GroupBy(d => d.County)
                    .Select(g => new { name = g.Key, count = g.Count() })
                    .OrderByDescending(x => x.count)
                    .Take(3)
                    .ToListAsync();

                return Ok(new { total = totalDocuments, totalDocuments, totalSubmissions, accepted, rejected, topCounties });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch document analytics.");
                return StatusCode(500, new { message = "Failed to fetch analytics." });
            }
        }
    }
}
