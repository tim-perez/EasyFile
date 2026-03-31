using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using EasyFile.Constants; // 🛑 ADDED THIS
using EasyFile.Interfaces;

namespace EasyFile.Services
{
    public class AiReviewService : IAiReviewService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AiReviewService> _logger;
        private readonly string _apiKey;

        public AiReviewService(HttpClient httpClient, IConfiguration configuration, ILogger<AiReviewService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _apiKey = configuration["OpenAI:ApiKey"] 
                      ?? throw new ArgumentNullException(nameof(configuration), "OpenAI API Key is missing in appsettings.json!");
        }

        public async Task<string> GenerateDocumentReportAsync(string extractedText)
        {
            var requestBody = new
            {
                model = "gpt-4o-mini",
                response_format = new { type = "json_object" },
                temperature = 0.1, 
                messages = new[]
                {
                    // 🛑 CHANGED: Pulling the prompt cleanly from our Constants file!
                    new { role = "system", content = AiPrompts.SystemPrompt }, 
                    new { role = "user", content = $"Here is the extracted document text:\n\n{extractedText}" }
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
            request.Headers.Add("Authorization", $"Bearer {_apiKey}");
            request.Content = jsonContent;

            var response = await _httpClient.SendAsync(request);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("OpenAI API failed with status {StatusCode}. Response: {Response}", response.StatusCode, responseString);
                throw new HttpRequestException("Failed to communicate with OpenAI API.");
            }

            using JsonDocument doc = JsonDocument.Parse(responseString);
            var aiMessage = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return aiMessage ?? "{}";
        }
    }
}