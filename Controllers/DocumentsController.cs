using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System;
using System.Threading.Tasks;
using System.Text.Json;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using EasyFile.Data;
using EasyFile.Models;
using EasyFile.Interfaces;

namespace EasyFile.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly IDocumentService _documentService;
        private readonly ITextractService _textractService;
        private readonly IAiReviewService _aiReviewService;

        public DocumentsController(
            AppDbContext dbContext,
            IDocumentService documentService,
            ITextractService textractService,
            IAiReviewService aiReviewService)
        {
            _dbContext = dbContext;
            _documentService = documentService;
            _textractService = textractService;
            _aiReviewService = aiReviewService;
        }

        // ==========================================
        // 1. UPLOAD AND EXTRACT DATA
        // ==========================================
        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument(IFormFile file, [FromForm] string userId)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "No file uploaded." });

                // 1. Keep track of the exact name the user uploaded (e.g. "SUM-100.pdf")
                var originalFileName = file.FileName;

                // 2. Upload to S3
                var fileKey = await _documentService.UploadDocumentAsync(file, userId);

                // 3. Extract Text via AWS Textract
                using var fileStream = file.OpenReadStream();
                var extractedText = await _textractService.ExtractTextAsync(fileStream);

                // 4. Send text to AI and get JSON back
                var aiReportJson = await _aiReviewService.GenerateDocumentReportAsync(extractedText);

                // 5. Parse the JSON to grab the "Fill in the Blank" data
                using JsonDocument jsonDoc = JsonDocument.Parse(aiReportJson);
                var aiTitle = jsonDoc.RootElement.GetProperty("documentTitle").GetString();
                var aiCaseNumber = jsonDoc.RootElement.GetProperty("caseNumber").GetString();
                var aiStatus = jsonDoc.RootElement.GetProperty("status").GetString();
                
                // OPTIMIZATION: Grab the county once and save it as a variable!
                var aiCounty = jsonDoc.RootElement.GetProperty("county").GetString();

                // Print the exact data to your terminal
                Console.WriteLine("\n=== AI EXTRACTION SUCCESS ===");
                Console.WriteLine($"File Name Caught: {originalFileName}");
                Console.WriteLine($"AI Document Title: {aiTitle}");
                Console.WriteLine($"AI Case Number: {aiCaseNumber}");
                Console.WriteLine($"AI County: {aiCounty ?? "Unknown"}");
                Console.WriteLine("=============================\n");

                // 6. Save EVERYTHING to SQL Server
                var newDocument = new Document
                {
                    UploaderId = int.Parse(userId),
                    FileName = originalFileName,               
                    DocumentTitle = aiTitle ?? "Unknown",      
                    CaseNumber = aiCaseNumber ?? "Missing",    
                    FileUrl = fileKey,                         
                    FileType = file.ContentType,
                    Status = aiStatus ?? "Processed",
                    County = aiCounty ?? "Unknown" // Use the variable here!
                };

                _dbContext.Documents.Add(newDocument);
                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "Upload and AI analysis complete!", documentId = newDocument.Id });
            }
            catch (Exception ex)
            {
                var actualError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, new { message = "An error occurred.", error = actualError });
            }
        }

        // ==========================================
        // 2. GET ALL DOCUMENTS FOR THE TABLE
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> GetDocuments()
        {
            try
            {
                var documents = await _dbContext.Documents
                    .Where(d => d.Recycled == false) // NEW: Hide recycled documents!
                    .OrderByDescending(d => d.CreatedAt)
                    .ToListAsync();
                    
                return Ok(documents);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch documents.", error = ex.Message });
            }
        }

        // ==========================================
        // 3. GET SECURE AWS LINK FOR VIEWING
        // ==========================================
        [HttpGet("{id}/url")]
        public async Task<IActionResult> GetDocumentUrl(int id)
        {
            try
            {
                var doc = await _dbContext.Documents.FindAsync(id);
                if (doc == null) return NotFound(new { message = "Document not found." });

                // Notice we are using doc.FileUrl here!
                var url = await _documentService.GetDocumentPresignedUrlAsync(doc.FileUrl);
                
                return Ok(new { url = url });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Could not generate link.", error = ex.Message });
            }
        }

        // ==========================================
        // 4. SOFT DELETE A DOCUMENT
        // ==========================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            try
            {
                var doc = await _dbContext.Documents.FindAsync(id);
                if (doc == null) return NotFound(new { message = "Document not found." });

                // NEW: Soft Delete Logic! 
                // We do NOT delete from AWS S3 here. We just tag it for the Recycle Bin.
                doc.Recycled = true;
                doc.DeletedAt = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "Document moved to recycle bin." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to delete document.", error = ex.Message });
            }
        }

        // ==========================================
        // 5. GET RECYCLED DOCUMENTS
        // ==========================================
        [HttpGet("recycle")]
        public async Task<IActionResult> GetRecycledDocuments()
        {
            try
            {
                var documents = await _dbContext.Documents
                    .Where(d => d.Recycled == true) // ONLY grab the recycled ones!
                    .OrderByDescending(d => d.DeletedAt) // Order by when they were deleted
                    .ToListAsync();
                    
                return Ok(documents);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch recycled documents.", error = ex.Message });
            }
        }

        // ==========================================
        // 6. RESTORE A DOCUMENT
        // ==========================================
        [HttpPost("{id}/restore")]
        public async Task<IActionResult> RestoreDocument(int id)
        {
            try
            {
                var doc = await _dbContext.Documents.FindAsync(id);
                if (doc == null) return NotFound(new { message = "Document not found." });

                // Un-tag the document and clear the deleted date
                doc.Recycled = false;
                doc.DeletedAt = null;

                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "Document restored successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to restore document.", error = ex.Message });
            }
        }

        // ==========================================
        // 7. PERMANENTLY DELETE A DOCUMENT (The Shredder)
        // ==========================================
        [HttpDelete("{id}/permanent")]
        public async Task<IActionResult> HardDeleteDocument(int id)
        {
            try
            {
                var doc = await _dbContext.Documents.FindAsync(id);
                if (doc == null) return NotFound(new { message = "Document not found." });

                // 1. Permanently delete from AWS S3
                try 
                {
                    await _documentService.DeleteDocumentAsync(doc.FileUrl);
                }
                catch (Exception s3Ex)
                {
                    Console.WriteLine($"S3 Delete Warning: {s3Ex.Message}");
                }

                // 2. Erase record from SQL entirely
                _dbContext.Documents.Remove(doc);
                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "Document permanently deleted." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to permanently delete.", error = ex.Message });
            }
        }
    }
}