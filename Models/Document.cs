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
    
    // NEW: Columns for AI Extraction and File Naming
    public string FileName { get; set; } = string.Empty;       // e.g., "SUM-100.pdf"
    public string DocumentTitle { get; set; } = "Processing..."; // e.g., "Summons"
    public string CaseNumber { get; set; } = "Processing...";    // e.g., "CV12345"
    public string CaseTitle { get; set; } = "Processing...";     // e.g., "John Doe vs. Acme Corp."

    public string County { get; set; } = string.Empty;
    
    public string EFilingDocType { get; set; } = string.Empty;
    public string EstimatedFee { get; set; } = string.Empty;
    public string FilingType { get; set; } = string.Empty;
    public string CaseCategory { get; set; } = string.Empty;
    public string CaseType { get; set; } = string.Empty;
    public string FiledBy { get; set; } = string.Empty;
    public string RefersTo { get; set; } = string.Empty;
    public string Representation { get; set; } = string.Empty;
    public string Warnings { get; set; } = string.Empty; // We will save the array as a comma-separated string

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