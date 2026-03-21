using EasyFile.Interfaces;
using Microsoft.Extensions.Configuration;
using OpenAI.Chat;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace EasyFile.Services
{
    public class AiReviewService : IAiReviewService
    {
        private readonly string _apiKey;

        public AiReviewService(IConfiguration configuration)
        {
            _apiKey = configuration["OpenAI:ApiKey"] 
                      ?? throw new ArgumentNullException("OpenAI API Key is missing.");
        }

        public async Task<string> GenerateDocumentReportAsync(string documentText)
        {
            // =====================================================================
            // TEMPORARILY COMMENTED OUT TO BYPASS OPENAI 429 QUOTA ERROR
            // =====================================================================
            /*
            var client = new ChatClient("gpt-4o-mini", _apiKey);
            // ... OpenAI logic ...
            var response = await client.CompleteChatAsync(messages);
            return response.Value.Content[0].Text;
            */
            // =====================================================================

            // 1. Simulate the time it takes for AI to "think" 
            await Task.Delay(2000);

            // 2. Return a simulated JSON string instead of standard text!
            // This allows the Controller to pull out specific data points.
            return @"{
                ""documentTitle"": ""Summons"",
                ""caseNumber"": ""2026-CV-12345"",
                ""status"": ""Approved"",
                ""summary"": ""This is a simulated AI review of the summons.""
            }";
        }
    }
}