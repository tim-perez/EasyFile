using System.IO;
using System.Threading.Tasks;
namespace EasyFile.Interfaces
{
    /// <summary>
    /// Service responsible for analyzing document text using AI models.
    /// </summary>
    public interface IAiReviewService
    {
        /// <summary>
        /// Generates a structured JSON report analyzing the provided legal document text.
        /// </summary>
        /// <param name="documentText">The raw extracted text of the document.</param>
        /// <returns>A JSON string containing the AI's structured analysis.</returns>
        Task<string> GenerateDocumentReportAsync(string documentText);
    }
}