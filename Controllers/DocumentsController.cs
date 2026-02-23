using Microsoft.AspNetCore.Mvc;
using EasyFile.Models;
using EasyFile.Interfaces;
using System.Threading.Tasks;

namespace EasyFile.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
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