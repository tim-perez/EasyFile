using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using EasyFile.Interfaces;

namespace EasyFile.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly IAmazonS3 _s3Client;
        private const string BucketName = "easyfile-documents-dev"; // Store in appsettings.json in production

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

        public async Task DeleteDocumentAsync(string fileKey)
        {
            var deleteRequest = new DeleteObjectRequest
            {
                BucketName = BucketName,
                Key = fileKey
            };

            await _s3Client.DeleteObjectAsync(deleteRequest);
        }
        public async Task DeleteUserFolderAsync(string userId)
        {
            try 
            {
                // 1. Tell AWS to find all files that start with this user's specific folder path
                var listRequest = new Amazon.S3.Model.ListObjectsV2Request
                {
                    BucketName = BucketName,
                    Prefix = $"uploads/{userId}/"
                };

                var listResponse = await _s3Client.ListObjectsV2Async(listRequest);

                // 2. Loop through and delete every single file found in that folder
                foreach (var s3Object in listResponse.S3Objects)
                {
                    var deleteRequest = new Amazon.S3.Model.DeleteObjectRequest
                    {
                        BucketName = BucketName,
                        Key = s3Object.Key
                    };

                    await _s3Client.DeleteObjectAsync(deleteRequest);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to delete S3 folder for User {userId}: {ex.Message}");
            }
        }
    }
}