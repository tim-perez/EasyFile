namespace EasyFile.Models.Pagination
{
    public class UserQueryParameters
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;

        public string? SortColumn { get; set; } = "date";
        public string? SortDirection { get; set; } = "desc";

        public string? SearchTerm { get; set; }
        public string? RoleFilter { get; set; } = "All";
    }
}