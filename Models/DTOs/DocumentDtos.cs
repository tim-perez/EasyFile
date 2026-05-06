using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EasyFile.Models.DTOs
{
    public class BulkEditRequest
    {
        public List<int> DocumentIds { get; set; } = new List<int>();
        public string? FileName { get; set; }
        public string? DocumentTitle { get; set; }
        public string? CaseNumber { get; set; }
        public string? County { get; set; }
    }

    public class BulkDownloadRequest
    {
        public List<int> DocumentIds { get; set; } = new List<int>();
    }

    public class AiDocumentReportDto
    {
        [JsonPropertyName("status")] public string? Status { get; set; }
        [JsonPropertyName("documentTitle")] public string? DocumentTitle { get; set; }
        [JsonPropertyName("suggestedDocumentTypes")] public List<string>? SuggestedDocumentTypes { get; set; }
        [JsonPropertyName("caseTitle")] public string? CaseTitle { get; set; }
        [JsonPropertyName("caseNumber")] public string? CaseNumber { get; set; }
        [JsonPropertyName("county")] public string? County { get; set; }
        [JsonPropertyName("eFilingDocType")] public string? EFilingDocType { get; set; }
        [JsonPropertyName("estimatedFee")] public string? EstimatedFee { get; set; }
        [JsonPropertyName("filingType")] public string? FilingType { get; set; }
        [JsonPropertyName("caseCategory")] public string? CaseCategory { get; set; }
        [JsonPropertyName("caseType")] public string? CaseType { get; set; }
        [JsonPropertyName("filedBy")] public string? FiledBy { get; set; }
        [JsonPropertyName("refersTo")] public string? RefersTo { get; set; }
        [JsonPropertyName("representation")] public string? Representation { get; set; }
        [JsonPropertyName("prediction")] public string? Prediction { get; set; }
        [JsonPropertyName("warnings")] public List<string>? Warnings { get; set; }
    }

    public class SubmissionDocumentDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string DocumentTitle { get; set; } = "Unknown";
        public string EFilingDocType { get; set; } = "Unknown";
        public string SuggestedDocumentTypes { get; set; } = string.Empty;
        public decimal DocumentFee { get; set; }
        public string EstimatedFee { get; set; } = "$0.00";
        public string Prediction { get; set; } = "Unknown";
        public string Warnings { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class SubmissionDto
    {
        public int Id { get; set; }
        public string SubmissionNumber { get; set; } = string.Empty;
        public int UploaderId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public bool Recycled { get; set; }
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
        public int DocumentsUploaded { get; set; }
        public int AcceptedCount { get; set; }
        public int RejectedCount { get; set; }
        public List<SubmissionDocumentDto> Documents { get; set; } = new();
    }
}
