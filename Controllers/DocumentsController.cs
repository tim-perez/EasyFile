using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Linq;
using EasyFile.Interfaces; // Or EasyFile.Interfaces depending on where your old interface was
using EasyFile.Data;
using EasyFile.Models;

namespace EasyFile.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly IDocumentService _documentService;
        private readonly AppDbContext _dbContext;
        private readonly ITextractService _textractService;
        private readonly IAiReviewService _aiReviewService;

        // 1. We added the two new services to the constructor here
        public DocumentsController(
            IDocumentService documentService, 
            AppDbContext dbContext,
            ITextractService textractService,
            IAiReviewService aiReviewService)
        {
            _documentService = documentService;
            _dbContext = dbContext;
            _textractService = textractService;
            _aiReviewService = aiReviewService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file was provided." });
            }

            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int uploaderId))
            {
                return Unauthorized(new { message = "Invalid user token." });
            }

            try
            {
                // ==========================================
                // STEP 1: THE EYES (Extract Text with AWS)
                // ==========================================
                string extractedText;
                using (var stream = file.OpenReadStream())
                {
                    extractedText = await _textractService.ExtractTextAsync(stream);
                }

                // ==========================================
                // STEP 2: THE BRAIN (Review Text with AI)
                // ==========================================
                var aiReport = await _aiReviewService.GenerateDocumentReportAsync(extractedText);

                // ==========================================
                // STEP 3: THE GATEKEEPER (Check for invalid files)
                // ==========================================
                if (aiReport.Trim() == "REJECT_NON_LEGAL_DOCUMENT")
                {
                    // We stop the process right here. The file is NOT saved to S3 or the DB.
                    return BadRequest(new { message = "The uploaded file does not appear to be a valid legal document. Please upload a court filing, affidavit, or similar legal document." });
                }

                // If it IS a legal document, we proceed with the normal S3 upload
                var fileKey = await _documentService.UploadDocumentAsync(file, userIdString);

                var document = new Document
                {
                    FileType = file.ContentType,
                    FileUrl = fileKey,
                    UploaderId = uploaderId,
                    ReportUrl = aiReport,   // Save the AI's checklist report to the database!
                    Status = "Reviewed"    // Let's automatically update the status to Reviewed!
                };

                _dbContext.Documents.Add(document);
                await _dbContext.SaveChangesAsync();

                return Ok(new { 
                    message = "File uploaded and successfully reviewed by AI.", 
                    documentId = document.Id,
                    fileUrl = document.FileUrl,
                    report = aiReport // We can send the report straight back to React too
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while uploading the file.", error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetDocuments()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int uploaderId))
            {
                return Unauthorized(new { message = "Invalid user token." });
            }

            var documents = await _dbContext.Documents
                .Where(d => d.UploaderId == uploaderId && !d.Recycled)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            return Ok(documents);
        }

        [HttpDelete("recycle")]
        public async Task<IActionResult> RecycleDocuments([FromBody] List<int> documentIds)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int uploaderId))
            {
                return Unauthorized(new { message = "Invalid user token." });
            }

            var documents = await _dbContext.Documents
                .Where(d => documentIds.Contains(d.Id) && d.UploaderId == uploaderId)
                .ToListAsync();
            
            foreach (var doc in documents)
            {
                doc.Recycled = true;
                doc.DeletedAt = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Documents successfully moved to trash." });
        }

        [HttpGet("recycle")]
        public async Task<IActionResult> GetRecycledDocuments()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int uploaderId))
            {
                return Unauthorized(new { message = "Invalid user token." });
            }

            var documents = await _dbContext.Documents
                .Where(d => d.UploaderId == uploaderId && d.Recycled)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            return Ok(documents);
        }

        [HttpPost("restore")]
        public async Task<IActionResult> RestoreDocuments([FromBody] List<int> documentIds)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int uploaderId))
            {
                return Unauthorized(new { message = "Invalid user token." });
            }

            var documents = await _dbContext.Documents
                .Where(d => documentIds.Contains(d.Id) && d.UploaderId == uploaderId)
                .ToListAsync();

            foreach (var doc in documents)
            {
                doc.Recycled = false;
                doc.DeletedAt = null;
            }

            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Documents successfully restored." });
        }

        [HttpDelete("permanent-delete")]
        public async Task<IActionResult> PermanentDeleteDocuments([FromBody] List<int> documentIds)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int uploaderId))
            {
                return Unauthorized(new { message = "Invalid user token." });
            }

            var documents = await _dbContext.Documents
                .Where(d => documentIds.Contains(d.Id) && d.UploaderId == uploaderId)
                .ToListAsync();

            foreach (var doc in documents)
            {
                await _documentService.DeleteDocumentAsync(doc.FileUrl);
            }
            _dbContext.Documents.RemoveRange(documents);
        
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Documents permanently deleted." });
        }
    }
}