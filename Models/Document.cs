using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EasyFile.Models;

public class Document
{
    [Key]
    public int Id { get; set; }
    
    public string FileType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Pending";
    public string FileUrl { get; set; } = string.Empty;
    public string ReportUrl { get; set; } = string.Empty;
    
    public int? StarRating { get; set; }
    public string? Feedback { get; set; }
    public bool Recycled { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    // Foreign keys
    public int UploaderId { get; set; }
    public int? ReviewerId { get; set; }

    // Navigation Properties
    public User Uploader { get; set; } = null!;
    public User? Reviewer { get; set; }
}