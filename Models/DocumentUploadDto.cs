using Microsoft.AspNetCore.Http;

namespace EasyFile.Models
{
    public class DocumentUploadDto
    {
        public int OrderId { get; set; }
        public required string Title { get; set; }
        public required string FileType { get; set; }
        public string? Tags { get; set; } 
        public int UploaderId { get; set; }
        public required IFormFile File { get; set; }
    }
}