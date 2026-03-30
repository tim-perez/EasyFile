using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace EasyFile.Interfaces
{
    /// <summary>
    /// Service responsible for managing physical document storage (e.g., AWS S3).
    /// </summary>
    public interface IDocumentService
    {
        /// <summary>
        /// Uploads a file to the storage provider under the user's specific directory.
        /// </summary>
        Task<string> UploadDocumentAsync(IFormFile file, string userId);
        
        /// <summary>
        /// Generates a secure, temporary URL for accessing a private document.
        /// </summary>
        Task<string> GetDocumentPresignedUrlAsync(string fileKey);
        
        /// <summary>
        /// Permanently deletes a single document from the storage provider.
        /// </summary>
        Task DeleteDocumentAsync(string fileKey);
        
        /// <summary>
        /// Nuke operation: Permanently deletes all files associated with a specific user.
        /// </summary>
        Task DeleteUserFolderAsync(string userId);
    }
}