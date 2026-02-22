using Microsoft.AspNetCore.Mvc;
using EasyFile.Models;
using EasyFile.Interfaces;
using System.IO;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Configuration;
using System;

namespace EasyFile.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentsController : ControllerBase
    {
        private readonly IDocumentRepository _repository;
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;

        public DocumentsController(IDocumentRepository repository, IAmazonS3 s3Client, IConfiguration configuration)
        {
            _repository = repository;
            _s3Client = s3Client;
            _bucketName = configuration["AWS:BucketName"] ?? throw new ArgumentNullException("AWS BucketName configuration is missing.");
        }

        [HttpPost]
        public async Task<IActionResult> UploadDocument([FromForm] DocumentUploadDto uploadDto)
        {
            if (uploadDto.File == null || uploadDto.File.Length == 0)
                return BadRequest("No file uploaded.");

            var fileKey = $"{Guid.NewGuid()}_{uploadDto.File.FileName}";
            var s3Url = $"https://{_bucketName}.s3.amazonaws.com/{fileKey}";

            using (var newMemoryStream = new MemoryStream())
            {
                await uploadDto.File.CopyToAsync(newMemoryStream);
                
                newMemoryStream.Position = 0; 
                
                var uploadRequest = new TransferUtilityUploadRequest
                {
                    InputStream = newMemoryStream,
                    Key = fileKey,
                    BucketName = _bucketName,
                    ContentType = uploadDto.File.ContentType
                };

                var fileTransferUtility = new TransferUtility(_s3Client);
                await fileTransferUtility.UploadAsync(uploadRequest);
            }

            await _repository.SaveDocumentMetadataAsync(uploadDto, s3Url);

            return Ok(new { Message = "File uploaded to AWS S3 successfully", Path = s3Url });
        }
    }
}