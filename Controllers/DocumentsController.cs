using Microsoft.AspNetCore.Mvc;
using EasyFile.Models;
using EasyFile.Interfaces;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace EasyFile.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // 🔒 Locks this controller so only requests with a valid JWT pass through
    public class DocumentsController : ControllerBase
    {
        private readonly IDocumentService _documentService;

        public DocumentsController(IDocumentService documentService)
        {
            _documentService = documentService;
        }

        [HttpPost]
        public async Task<IActionResult> UploadDocument([FromForm] DocumentUploadDto uploadDto)
        {
            var s3Url = await _documentService.UploadDocumentAsync(uploadDto);
            return Ok(new { Message = "File uploaded to AWS S3 successfully", Path = s3Url });
        }
    }
}