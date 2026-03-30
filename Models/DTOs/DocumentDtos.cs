using System.Collections.Generic;

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
}