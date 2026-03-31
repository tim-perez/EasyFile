namespace EasyFile.Models.Pagination
{
    public class DocumentQueryParameters
    {
        // Pagination Defaults
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;

        // Sorting
        public string? SortColumn { get; set; } = "date";
        public string? SortDirection { get; set; } = "desc";

        // Filtering
        public string? SearchTerm { get; set; }
        public string? DocumentTitle { get; set; }
        public string? CaseNumber { get; set; }
        public string? County { get; set; }
        public string? Status { get; set; }
    }
}