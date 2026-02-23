using Amazon.S3;
using Amazon.S3.Transfer;
using EasyFile.Interfaces;
using EasyFile.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Threading.Tasks;

namespace EasyFile.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly IDocumentRepository _repository;
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;

        public DocumentService(IDocumentRepository repository, IAmazonS3 s3Client, IConfiguration configuration)
        {
            _repository = repository;
            _s3Client = s3Client;
            _bucketName = configuration["AWS:BucketName"] ?? throw new ArgumentNullException("AWS BucketName configuration is missing.");
        }

        public async Task<string> UploadDocumentAsync(DocumentUploadDto uploadDto)
        {
            if (uploadDto.File == null || uploadDto.File.Length == 0)
                throw new ArgumentException("No file uploaded.");

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

            return s3Url;
        }
    }
}