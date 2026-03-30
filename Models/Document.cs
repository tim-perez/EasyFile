using System;
using System.ComponentModel.DataAnnotations;

namespace EasyFile.Models;

public class Document
{
    [Key]
    public int Id { get; set; }
    
    // Core Properties
    public string FileType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Pending";
    public string FileUrl { get; set; } = string.Empty;
    public string ReportUrl { get; set; } = string.Empty;
    
    // AI Extraction & Naming
    public string FileName { get; set; } = string.Empty;       
    public string DocumentTitle { get; set; } = "Processing..."; 
    public string CaseNumber { get; set; } = "Processing...";    
    public string CaseTitle { get; set; } = "Processing...";     
    public string Prediction { get; set; } = string.Empty; 
    public string County { get; set; } = string.Empty;
    
    // E-Filing Properties
    public string EFilingDocType { get; set; } = string.Empty;
    public string EstimatedFee { get; set; } = string.Empty;
    public string FilingType { get; set; } = string.Empty;
    public string CaseCategory { get; set; } = string.Empty;
    public string CaseType { get; set; } = string.Empty;
    public string FiledBy { get; set; } = string.Empty;
    public string RefersTo { get; set; } = string.Empty;
    public string Representation { get; set; } = string.Empty;
    public string Warnings { get; set; } = string.Empty; 
    
    // User Interaction & State
    public int? StarRating { get; set; }
    public string? Feedback { get; set; }
    public bool Recycled { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    // Foreign Keys
    public int UploaderId { get; set; }
    public int? ReviewerId { get; set; }

    // Navigation Properties
    public User Uploader { get; set; } = null!;
    public User? Reviewer { get; set; }
}