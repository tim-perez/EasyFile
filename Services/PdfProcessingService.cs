using System.IO;
using PdfSharpCore.Pdf;
using PdfSharpCore.Pdf.IO;

namespace EasyFile.Services
{
    public interface IPdfProcessingService
    {
        Stream ExtractFirstPage(Stream originalPdfStream);
    }

    public class PdfProcessingService : IPdfProcessingService
    {
        public Stream ExtractFirstPage(Stream originalPdfStream)
        {
            // Load the original document
            using var originalDocument = PdfReader.Open(originalPdfStream, PdfDocumentOpenMode.Import);
            
            // Create a new document for the extracted page
            using var newDocument = new PdfDocument();

            // Extract the first page (index 0)
            if (originalDocument.PageCount > 0)
            {
                newDocument.AddPage(originalDocument.Pages[0]);
            }

            // Save the single page to a memory stream
            var memoryStream = new MemoryStream();
            newDocument.Save(memoryStream);
            
            // Reset position for reading downstream
            memoryStream.Position = 0; 

            return memoryStream;
        }
    }
}