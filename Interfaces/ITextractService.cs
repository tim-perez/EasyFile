using System.IO;
using System.Threading.Tasks;

namespace EasyFile.Interfaces
{
    /// <summary>
    /// Service responsible for Optical Character Recognition (OCR) and text extraction.
    /// </summary>
    public interface ITextractService
    {
        /// <summary>
        /// Extracts raw machine-readable text from a file stream using AWS Textract.
        /// </summary>
        /// <param name="fileStream">The raw byte stream of the uploaded document.</param>
        /// <returns>A single string containing all extracted text.</returns>
        Task<string> ExtractTextAsync(Stream fileStream);
    }
}