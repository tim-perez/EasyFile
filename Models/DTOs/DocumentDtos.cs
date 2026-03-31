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
}