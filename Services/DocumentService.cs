using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using EasyFile.Interfaces;

namespace EasyFile.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly ILogger<DocumentService> _logger;
        private readonly string _bucketName;

        public DocumentService(IAmazonS3 s3Client, IConfiguration configuration, ILogger<DocumentService> logger)
        {
            _s3Client = s3Client;
            _logger = logger;
            _bucketName = configuration["AWS:BucketName"] 
                          ?? throw new ArgumentNullException(nameof(configuration), "AWS BucketName is missing in configuration!");
        }

        public async Task<string> UploadDocumentAsync(IFormFile file, string userId)
        {
            var fileKey = $"uploads/{userId}/{Guid.NewGuid()}_{file.FileName}";

            // Optimization: Stream directly to S3 instead of loading the whole file into server RAM
            using var stream = file.OpenReadStream();

            var uploadRequest = new PutObjectRequest
            {
                InputStream = stream,
                Key = fileKey,
                BucketName = _bucketName,
                ContentType = file.ContentType
            };

            await _s3Client.PutObjectAsync(uploadRequest);
            
            _logger.LogInformation("Successfully uploaded {FileName} to S3 for user {UserId}.", file.FileName, userId);

            return fileKey;
        }

        public async Task<string> GetDocumentPresignedUrlAsync(string fileKey)
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = fileKey,
                Expires = DateTime.UtcNow.AddMinutes(30)
            };

            return await _s3Client.GetPreSignedURLAsync(request);
        }

        public async Task DeleteDocumentAsync(string fileKey)
        {
            try
            {
                var deleteRequest = new DeleteObjectRequest
                {
                    BucketName = _bucketName,
                    Key = fileKey
                };

                await _s3Client.DeleteObjectAsync(deleteRequest);
                _logger.LogInformation("Successfully deleted {FileKey} from S3.", fileKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete file {FileKey} from S3.", fileKey);
                throw;
            }
        }

        public async Task DeleteUserFolderAsync(string userId)
        {
            try 
            {
                var listRequest = new ListObjectsV2Request
                {
                    BucketName = _bucketName,
                    Prefix = $"uploads/{userId}/"
                };

                var listResponse = await _s3Client.ListObjectsV2Async(listRequest);

                if (listResponse.S3Objects.Count == 0) return;

                // Optimization: Use AWS Batch Delete instead of deleting one-by-one
                var deleteObjectsRequest = new DeleteObjectsRequest { BucketName = _bucketName };

                foreach (var s3Object in listResponse.S3Objects)
                {
                    deleteObjectsRequest.AddKey(s3Object.Key);
                }

                await _s3Client.DeleteObjectsAsync(deleteObjectsRequest);
                _logger.LogInformation("Successfully batch-deleted {Count} files for User {UserId}.", listResponse.S3Objects.Count, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete S3 folder for User {UserId}.", userId);
            }
        }
    }
}