using System.Globalization;
using System.IO.Compression;
using System.Security.Claims;
using EasyFile.Data;
using EasyFile.Interfaces;
using EasyFile.Models;
using EasyFile.Models.DTOs;
using EasyFile.Models.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyFile.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SubmissionsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly IDocumentService _documentService;
        private readonly IPdfReportService _pdfReportService;
        private readonly ILogger<SubmissionsController> _logger;

        public SubmissionsController(
            AppDbContext dbContext,
            IDocumentService documentService,
            IPdfReportService pdfReportService,
            ILogger<SubmissionsController> logger)
        {
            _dbContext = dbContext;
            _documentService = documentService;
            _pdfReportService = pdfReportService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetSubmissions([FromQuery] DocumentQueryParameters queryParams)
        {
            try
            {
                if (!TryGetCurrentUser(out var userId, out var userRole)) return Unauthorized();

                var query = _dbContext.Submissions
                    .Include(s => s.Documents)
                    .Where(s => s.Recycled == false);

                if (userRole != "Admin") query = query.Where(s => s.UploaderId == userId);

                if (!string.IsNullOrWhiteSpace(queryParams.SearchTerm))
                {
                    var search = queryParams.SearchTerm.ToLower();
                    query = query.Where(s =>
                        s.SubmissionNumber.ToLower().Contains(search) ||
                        s.County.ToLower().Contains(search) ||
                        s.CaseNumber.ToLower().Contains(search) ||
                        s.Documents.Any(d => d.FileName.ToLower().Contains(search) || d.DocumentTitle.ToLower().Contains(search)));
                }

                if (!string.IsNullOrWhiteSpace(queryParams.CaseNumber))
                    query = query.Where(s => s.CaseNumber == queryParams.CaseNumber);
                if (!string.IsNullOrWhiteSpace(queryParams.County))
                    query = query.Where(s => s.County == queryParams.County);

                var totalCount = await query.CountAsync();
                var isDesc = queryParams.SortDirection?.ToLower() == "desc";
                query = queryParams.SortColumn?.ToLower() switch
                {
                    "submissionnumber" => isDesc ? query.OrderByDescending(s => s.SubmissionNumber) : query.OrderBy(s => s.SubmissionNumber),
                    "county" => isDesc ? query.OrderByDescending(s => s.County) : query.OrderBy(s => s.County),
                    "casenumber" => isDesc ? query.OrderByDescending(s => s.CaseNumber) : query.OrderBy(s => s.CaseNumber),
                    "documentsuploaded" => isDesc ? query.OrderByDescending(s => s.Documents.Count(d => !d.Recycled)) : query.OrderBy(s => s.Documents.Count(d => !d.Recycled)),
                    _ => isDesc ? query.OrderByDescending(s => s.CreatedAt) : query.OrderBy(s => s.CreatedAt)
                };

                var submissions = await query
                    .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                    .Take(queryParams.PageSize)
                    .ToListAsync();

                return Ok(new PagedResult<SubmissionDto>
                {
                    Items = submissions.Select(s => ToDto(s, includeRecycledDocuments: false)).ToList(),
                    TotalCount = totalCount,
                    PageNumber = queryParams.PageNumber,
                    PageSize = queryParams.PageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch submissions.");
                return StatusCode(500, new { message = "Failed to fetch submissions." });
            }
        }

        [HttpGet("recycle")]
        public async Task<IActionResult> GetRecycledSubmissions()
        {
            try
            {
                if (!TryGetCurrentUser(out var userId, out var userRole)) return Unauthorized();

                var query = _dbContext.Submissions
                    .Include(s => s.Documents)
                    .Where(s => s.Recycled || s.Documents.Any(d => d.Recycled));

                if (userRole != "Admin") query = query.Where(s => s.UploaderId == userId);

                var submissions = await query
                    .OrderByDescending(s => s.DeletedAt ?? s.Documents.Max(d => d.DeletedAt))
                    .ToListAsync();

                return Ok(submissions.Select(s => ToDto(s, includeRecycledDocuments: true)).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch recycled submissions.");
                return StatusCode(500, new { message = "Failed to fetch recycled submissions." });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSubmission(int id)
        {
            try
            {
                var submission = await _dbContext.Submissions.Include(s => s.Documents).FirstOrDefaultAsync(s => s.Id == id);
                if (submission == null) return NotFound(new { message = "Submission not found." });

                var now = DateTime.UtcNow;
                submission.Recycled = true;
                submission.DeletedAt = now;

                foreach (var document in submission.Documents.Where(d => !d.Recycled))
                {
                    document.Recycled = true;
                    document.DeletedAt = now;
                }

                await _dbContext.SaveChangesAsync();
                return Ok(new { message = "Submission moved to recycle bin." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to soft-delete submission {Id}.", id);
                return StatusCode(500, new { message = "Failed to delete submission." });
            }
        }

        [HttpPost("{id}/restore")]
        public async Task<IActionResult> RestoreSubmission(int id)
        {
            try
            {
                var submission = await _dbContext.Submissions.Include(s => s.Documents).FirstOrDefaultAsync(s => s.Id == id);
                if (submission == null) return NotFound(new { message = "Submission not found." });

                submission.Recycled = false;
                submission.DeletedAt = null;

                foreach (var document in submission.Documents.Where(d => d.Recycled))
                {
                    document.Recycled = false;
                    document.DeletedAt = null;
                }

                await _dbContext.SaveChangesAsync();
                return Ok(new { message = "Submission restored successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to restore submission {Id}.", id);
                return StatusCode(500, new { message = "Failed to restore submission." });
            }
        }

        [HttpDelete("{id}/permanent")]
        public async Task<IActionResult> HardDeleteSubmission(int id)
        {
            try
            {
                var submission = await _dbContext.Submissions.Include(s => s.Documents).FirstOrDefaultAsync(s => s.Id == id);
                if (submission == null) return NotFound(new { message = "Submission not found." });

                var documentsToDelete = submission.Recycled
                    ? submission.Documents.ToList()
                    : submission.Documents.Where(d => d.Recycled).ToList();

                foreach (var document in documentsToDelete)
                {
                    try { await _documentService.DeleteDocumentAsync(document.FileUrl); }
                    catch (Exception s3Ex) { _logger.LogWarning(s3Ex, "S3 Delete Warning for document {Id}.", document.Id); }
                }

                _dbContext.Documents.RemoveRange(documentsToDelete);
                if (submission.Recycled || submission.Documents.Count == documentsToDelete.Count)
                {
                    _dbContext.Submissions.Remove(submission);
                }

                await _dbContext.SaveChangesAsync();
                return Ok(new { message = "Submission permanently deleted." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to permanently delete submission {Id}.", id);
                return StatusCode(500, new { message = "Failed to permanently delete submission." });
            }
        }

        [HttpGet("{id}/report/download")]
        public async Task<IActionResult> DownloadSubmissionReport(int id)
        {
            var submission = await _dbContext.Submissions.Include(s => s.Documents).FirstOrDefaultAsync(s => s.Id == id);
            if (submission == null) return NotFound(new { message = "Submission not found." });

            using var memoryStream = new MemoryStream();
            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
            {
                foreach (var doc in submission.Documents.Where(d => !d.Recycled))
                {
                    var pdfBytes = _pdfReportService.GenerateReport(doc);
                    var entry = archive.CreateEntry($"{doc.FileName ?? "Document"}_Document_Report.pdf", CompressionLevel.Fastest);
                    using var zipStream = entry.Open();
                    zipStream.Write(pdfBytes, 0, pdfBytes.Length);
                }
            }

            memoryStream.Seek(0, SeekOrigin.Begin);
            return File(memoryStream.ToArray(), "application/zip", $"Submission_{submission.SubmissionNumber}_Reports.zip");
        }

        private bool TryGetCurrentUser(out int userId, out string? userRole)
        {
            userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            return int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out userId);
        }

        private static SubmissionDto ToDto(Submission submission, bool includeRecycledDocuments)
        {
            var documents = submission.Documents
                .Where(d => includeRecycledDocuments ? d.Recycled : !d.Recycled)
                .OrderBy(d => d.CreatedAt)
                .ToList();
            var accepted = documents.Count(d => string.Equals(d.Prediction, "Accepted", StringComparison.OrdinalIgnoreCase));
            var rejected = documents.Count(d => string.Equals(d.Prediction, "Rejected", StringComparison.OrdinalIgnoreCase));

            return new SubmissionDto
            {
                Id = submission.Id,
                SubmissionNumber = submission.SubmissionNumber,
                UploaderId = submission.UploaderId,
                CreatedAt = submission.CreatedAt,
                DeletedAt = submission.DeletedAt ?? documents.MaxBy(d => d.DeletedAt)?.DeletedAt,
                Recycled = submission.Recycled,
                County = string.IsNullOrWhiteSpace(submission.County) ? "Unknown" : submission.County,
                CaseNumber = string.IsNullOrWhiteSpace(submission.CaseNumber) ? "Not Yet Assigned" : submission.CaseNumber,
                CaseTitle = submission.CaseTitle,
                FilingType = string.IsNullOrWhiteSpace(submission.CaseNumber) || submission.CaseNumber == "Not Yet Assigned" ? "Case Initiation" : "Subsequent",
                CaseCategory = submission.CaseCategory,
                CaseType = submission.CaseType,
                PlaintiffsOrPetitioners = submission.PlaintiffsOrPetitioners,
                DefendantsOrRespondents = submission.DefendantsOrRespondents,
                Attorneys = submission.Attorneys,
                Summary = submission.Summary,
                TotalCourtFees = documents.Sum(d => d.DocumentFee),
                DocumentsUploaded = documents.Count,
                AcceptedCount = accepted,
                RejectedCount = rejected,
                Documents = documents.Select(d => new SubmissionDocumentDto
                {
                    Id = d.Id,
                    FileName = d.FileName,
                    DocumentTitle = d.DocumentTitle,
                    EFilingDocType = d.EFilingDocType,
                    SuggestedDocumentTypes = d.SuggestedDocumentTypes,
                    DocumentFee = d.DocumentFee,
                    EstimatedFee = string.IsNullOrWhiteSpace(d.EstimatedFee) ? d.DocumentFee.ToString("C", CultureInfo.GetCultureInfo("en-US")) : d.EstimatedFee,
                    Prediction = d.Prediction,
                    Warnings = d.Warnings,
                    CreatedAt = d.CreatedAt
                }).ToList()
            };
        }
    }
}
