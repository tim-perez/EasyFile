using System.IO;
using System.Threading.Tasks;
using System.IO.Compression;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EasyFile.Data;
using EasyFile.Interfaces;
using EasyFile.Models.DTOs;

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
        private readonly ILogger<DocumentsController> _logger;

        public DocumentsController(
            AppDbContext dbContext,
            IDocumentService documentService,
            ITextractService textractService,
            IAiReviewService aiReviewService,
            IPdfReportService pdfReportService,
            ILogger<DocumentsController> logger)
        {
            _dbContext = dbContext;
            _documentService = documentService;
            _textractService = textractService;
            _aiReviewService = aiReviewService;
            _pdfReportService = pdfReportService;
            _logger = logger;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument(IFormFile file, [FromForm] string userId)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "No file uploaded." });

                if (!int.TryParse(userId, out int parsedUserId))
                    return BadRequest(new { message = "Invalid user ID." });

                var userRecord = await _dbContext.Users.FindAsync(parsedUserId);
                if (userRecord != null && userRecord.AccountType == "Guest")
                {
                    var currentDocCount = await _dbContext.Documents.CountAsync(d => d.UploaderId == userRecord.Id);
                    if (currentDocCount >= 5)
                    {
                        return StatusCode(403, new { message = "Guest limit reached. Please register for a free account to upload more documents." });
                    }
                }

                var originalFileName = file.FileName;
                var fileKey = await _documentService.UploadDocumentAsync(file, userId);

                using var fileStream = file.OpenReadStream();
                var extractedText = await _textractService.ExtractTextAsync(fileStream);

                if (string.IsNullOrWhiteSpace(extractedText) || extractedText.Length < 50)
                {
                    _logger.LogWarning("File {FileName} failed text extraction.", originalFileName);

                    var failedDocument = new EasyFile.Models.Document
                    {
                        UploaderId = parsedUserId,
                        FileName = originalFileName,
                        DocumentTitle = "Non-Text Searchable",
                        CaseNumber = "Missing",
                        FileUrl = fileKey,
                        FileType = file.ContentType,
                        Status = "Failed",
                        County = "Unknown"
                    };

                    _dbContext.Documents.Add(failedDocument);
                    await _dbContext.SaveChangesAsync();

                    return Ok(new { message = "Document saved, but flagged as non-text searchable.", documentId = failedDocument.Id });
                }

                var aiReportJson = await _aiReviewService.GenerateDocumentReportAsync(extractedText);
                _logger.LogInformation("AI Review complete for {FileName}", originalFileName);

                using JsonDocument jsonDoc = JsonDocument.Parse(aiReportJson);
                var root = jsonDoc.RootElement;
                var aiStatus = root.TryGetProperty("status", out var statusProp) ? (statusProp.GetString() ?? "Processed") : "Processed";

                if (aiStatus == "REJECT_NON_LEGAL_DOCUMENT")
                {
                    _logger.LogWarning("File {FileName} rejected by AI as non-legal.", originalFileName);
                    await _documentService.DeleteDocumentAsync(fileKey);
                    return BadRequest(new { message = "Upload Failed: The uploaded file is not recognized as a valid legal document." });
                }

                var aiWarnings = root.TryGetProperty("warnings", out var warnProp) && warnProp.ValueKind == JsonValueKind.Array 
                    ? string.Join("|", warnProp.EnumerateArray().Select(w => w.GetString() ?? "")) 
                    : "";

                var newDocument = new EasyFile.Models.Document
                {
                    UploaderId = parsedUserId,
                    FileName = originalFileName ?? "Unknown_File.pdf",
                    DocumentTitle = root.TryGetProperty("documentTitle", out var titleProp) ? (titleProp.GetString() ?? "Unknown") : "Unknown",
                    CaseTitle = root.TryGetProperty("caseTitle", out var caseTitleProp) ? (caseTitleProp.GetString() ?? "Unknown") : "Unknown",
                    CaseNumber = root.TryGetProperty("caseNumber", out var caseProp) ? (caseProp.GetString() ?? "Missing") : "Missing",
                    FileUrl = fileKey ?? "Missing_URL",
                    FileType = file.ContentType ?? "application/pdf",
                    Status = aiStatus,
                    County = root.TryGetProperty("county", out var countyProp) ? (countyProp.GetString() ?? "Unknown") : "Unknown",
                    EFilingDocType = root.TryGetProperty("eFilingDocType", out var eTypeProp) ? (eTypeProp.GetString() ?? "Unknown") : "Unknown",
                    EstimatedFee = root.TryGetProperty("estimatedFee", out var feeProp) ? (feeProp.GetString() ?? "$0.00") : "$0.00",
                    FilingType = root.TryGetProperty("filingType", out var fTypeProp) ? (fTypeProp.GetString() ?? "Unknown") : "Unknown",
                    CaseCategory = root.TryGetProperty("caseCategory", out var catProp) ? (catProp.GetString() ?? "Unknown") : "Unknown",
                    CaseType = root.TryGetProperty("caseType", out var cTypeProp) ? (cTypeProp.GetString() ?? "Unknown") : "Unknown",
                    FiledBy = root.TryGetProperty("filedBy", out var filedProp) ? (filedProp.GetString() ?? "Unknown") : "Unknown",
                    RefersTo = root.TryGetProperty("refersTo", out var refersProp) ? (refersProp.GetString() ?? "Unknown") : "Unknown",
                    Representation = root.TryGetProperty("representation", out var repProp) ? (repProp.GetString() ?? "Unknown") : "Unknown",
                    Prediction = root.TryGetProperty("prediction", out var predProp) ? (predProp.GetString() ?? "Unknown") : "Unknown",
                    Warnings = aiWarnings
                };

                _dbContext.Documents.Add(newDocument);
                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "Upload and AI analysis complete!", documentId = newDocument.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing document upload.");
                return StatusCode(500, new { message = "An error occurred.", error = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetDocuments()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var query = _dbContext.Documents.Where(d => d.Recycled == false);

                if (userRole != "Admin")
                {
                    query = query.Where(d => d.UploaderId == userId);
                }

                var documents = await query.OrderByDescending(d => d.CreatedAt).ToListAsync();
                return Ok(documents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch documents.");
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

                if (userRole != "Admin")
                {
                    query = query.Where(d => d.UploaderId == userId);
                }

                var documents = await query.OrderByDescending(d => d.DeletedAt).ToListAsync();
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

        [HttpDelete("{id}/permanent")]
        public async Task<IActionResult> HardDeleteDocument(int id)
        {
            try
            {
                var doc = await _dbContext.Documents.FindAsync(id);
                if (doc == null) return NotFound(new { message = "Document not found." });

                try 
                {
                    await _documentService.DeleteDocumentAsync(doc.FileUrl);
                }
                catch (Exception s3Ex)
                {
                    _logger.LogWarning(s3Ex, "S3 Delete Warning for document {Id}.", id);
                }

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
                if (request.DocumentIds == null || !request.DocumentIds.Any())
                    return BadRequest(new { message = "No documents selected for editing." });

                var documents = await _dbContext.Documents
                    .Where(d => request.DocumentIds.Contains(d.Id) && d.Recycled == false)
                    .ToListAsync();

                if (!documents.Any())
                    return NotFound(new { message = "None of the selected documents were found." });

                foreach (var doc in documents)
                {
                    if (!string.IsNullOrWhiteSpace(request.FileName)) doc.FileName = request.FileName;
                    if (!string.IsNullOrWhiteSpace(request.DocumentTitle)) doc.DocumentTitle = request.DocumentTitle;
                    if (!string.IsNullOrWhiteSpace(request.CaseNumber)) doc.CaseNumber = request.CaseNumber;
                    if (!string.IsNullOrWhiteSpace(request.County)) doc.County = request.County;
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
                        // Notice it's passing "doc" here, not "document"
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
    }
}