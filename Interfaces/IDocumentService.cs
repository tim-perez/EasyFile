using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace EasyFile.Api.Interfaces
{
    public interface IDocumentService
    {
        Task<string> UploadDocumentAsync(IFormFile file, string userId);
        Task<string> GetDocumentPresignedUrlAsync(string fileKey);
        Task DeleteDocumentAsync(string fileKey);
    }
}