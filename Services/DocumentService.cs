using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using EasyFile.Api.Interfaces;

namespace EasyFile.Api.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly IAmazonS3 _s3Client;
        private const string BucketName = "easyfile-documents-bucket"; // Store in appsettings.json in production

        public DocumentService(IAmazonS3 s3Client)
        {
            _s3Client = s3Client;
        }

        public async Task<string> UploadDocumentAsync(IFormFile file, string userId)
        {
            var fileKey = $"uploads/{userId}/{Guid.NewGuid()}_{file.FileName}";

            using var newMemoryStream = new MemoryStream();
            await file.CopyToAsync(newMemoryStream);

            var uploadRequest = new PutObjectRequest
            {
                InputStream = newMemoryStream,
                Key = fileKey,
                BucketName = BucketName,
                ContentType = file.ContentType
            };

            await _s3Client.PutObjectAsync(uploadRequest);

            return fileKey;
        }

        public async Task<string> GetDocumentPresignedUrlAsync(string fileKey)
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = BucketName,
                Key = fileKey,
                Expires = DateTime.UtcNow.AddMinutes(30)
            };

            return await _s3Client.GetPreSignedURLAsync(request);
        }
    }
}