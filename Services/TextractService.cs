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
        private readonly IAmazonTextract _textractClient;

        // CHANGED: We inject the interface here so it inherits the keys from Program.cs!
        public TextractService(IAmazonTextract textractClient)
        {
            _textractClient = textractClient;
        }

        public async Task<string> ExtractTextAsync(Stream fileStream)
        {
            using var memoryStream = new MemoryStream();
            await fileStream.CopyToAsync(memoryStream);
            
            var request = new DetectDocumentTextRequest
            {
                Document = new Document
                {
                    Bytes = new MemoryStream(memoryStream.ToArray())
                }
            };

            var response = await _textractClient.DetectDocumentTextAsync(request);

            var extractedText = string.Join(" ", response.Blocks
                .Where(b => b.BlockType == BlockType.LINE)
                .Select(b => b.Text));

            return extractedText;
        }
    }
}