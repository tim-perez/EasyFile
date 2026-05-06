using System.ComponentModel.DataAnnotations;

namespace EasyFile.Models;

public class Submission
{
    [Key]
    public int Id { get; set; }

    public string SubmissionNumber { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool Recycled { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public string County { get; set; } = "Unknown";
    public string CaseNumber { get; set; } = "Not Yet Assigned";
    public string CaseTitle { get; set; } = "Unknown";
    public string FilingType { get; set; } = "Case Initiation";
    public string CaseCategory { get; set; } = "Unknown";
    public string CaseType { get; set; } = "Unknown";
    public string PlaintiffsOrPetitioners { get; set; } = "Unknown";
    public string DefendantsOrRespondents { get; set; } = "Unknown";
    public string Attorneys { get; set; } = "None";
    public string Summary { get; set; } = "Unknown";
    public decimal TotalCourtFees { get; set; }

    public int UploaderId { get; set; }
    public User Uploader { get; set; } = null!;

    public ICollection<Document> Documents { get; set; } = new List<Document>();
}
