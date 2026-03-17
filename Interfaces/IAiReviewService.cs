namespace EasyFile.Interfaces
{
    public interface IAiReviewService
    {
        Task<string> GenerateDocumentReportAsync(string documentText);
    }
}