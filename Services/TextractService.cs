using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Amazon.Textract;
using Amazon.Textract.Model;
using EasyFile.Interfaces;

namespace EasyFile.Services
{
    public class TextractService : ITextractService
    {
        private readonly AmazonTextractClient _textractClient;

        public TextractService()
        {
            // This automatically uses the same AWS credentials you set up for S3
            _textractClient = new AmazonTextractClient();
        }

        public async Task<string> ExtractTextAsync(Stream fileStream)
        {
            // Convert the incoming file stream into a byte array for AWS
            using var memoryStream = new MemoryStream();
            await fileStream.CopyToAsync(memoryStream);
            
            var request = new DetectDocumentTextRequest
            {
                Document = new Document
                {
                    Bytes = new MemoryStream(memoryStream.ToArray())
                }
            };

            // Send the file to AWS Textract
            var response = await _textractClient.DetectDocumentTextAsync(request);

            // Textract returns data in "Blocks". We just want to grab all the lines of text
            // and join them together with spaces so the AI can read it like a book.
            var extractedText = string.Join(" ", response.Blocks
                .Where(b => b.BlockType == BlockType.LINE)
                .Select(b => b.Text));

            return extractedText;
        }
    }
}