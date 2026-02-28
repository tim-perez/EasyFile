using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using EasyFile.Api.Interfaces;
using EasyFile.Data;
using EasyFile.Models;

namespace EasyFile.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly IDocumentService _documentService;
        private readonly AppDbContext _dbContext;

        public DocumentsController(IDocumentService documentService, AppDbContext dbContext)
        {
            _documentService = documentService;
            _dbContext = dbContext;
        }

        [HttpPost("upload/{orderId}")]
        public async Task<IActionResult> UploadDocument(int orderId, [FromForm] IFormFile file)
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
                var fileKey = await _documentService.UploadDocumentAsync(file, userIdString);

                var document = new Document
                {
                    OrderId = orderId,
                    Title = file.FileName,
                    FileType = file.ContentType,
                    FileUrl = fileKey,
                    UploaderId = uploaderId,
                    CreatedAt = DateTime.UtcNow,
                    Tags = "" // Provide default or accept from request
                };

                _dbContext.Documents.Add(document);
                await _dbContext.SaveChangesAsync();

                return Ok(new { 
                    message = "File uploaded successfully.", 
                    documentId = document.Id,
                    fileUrl = document.FileUrl 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while uploading the file.", error = ex.Message });
            }
        }
    }
}