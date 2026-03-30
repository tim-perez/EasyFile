using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Amazon.Textract;
using Amazon.Textract.Model;
using Microsoft.Extensions.Logging;
using EasyFile.Interfaces;

namespace EasyFile.Services
{
    /// <summary>
    /// Service responsible for extracting machine-readable text from document images and PDFs using AWS Textract.
    /// </summary>
    public class TextractService : ITextractService
    {
        private readonly IAmazonTextract _textractClient;
        private readonly ILogger<TextractService> _logger;

        public TextractService(IAmazonTextract textractClient, ILogger<TextractService> logger)
        {
            _textractClient = textractClient;
            _logger = logger;
        }

        public async Task<string> ExtractTextAsync(Stream fileStream)
        {
            try
            {
                using var memoryStream = new MemoryStream();
                await fileStream.CopyToAsync(memoryStream);
                
                // Optimization: Reset the stream position to the beginning instead of 
                // duplicating the entire file into a new byte array using .ToArray()
                memoryStream.Position = 0; 
                
                var request = new DetectDocumentTextRequest
                {
                    Document = new Document
                    {
                        Bytes = memoryStream
                    }
                };

                var response = await _textractClient.DetectDocumentTextAsync(request);

                var extractedText = string.Join(" ", response.Blocks
                    .Where(b => b.BlockType == BlockType.LINE)
                    .Select(b => b.Text));

                _logger.LogInformation("Successfully extracted {Length} characters from document via AWS Textract.", extractedText.Length);

                return extractedText;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to extract text from document using AWS Textract.");
                throw new InvalidOperationException("Text extraction failed.", ex);
            }
        }
    }
}