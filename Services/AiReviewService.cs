using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using EasyFile.Constants;
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
                .GetString() ?? "{}";

            // --- INJECT DETERMINISTIC CALCULATIONS HERE ---
            try
            {
                var jsonNode = JsonNode.Parse(aiMessage);
                if (jsonNode != null)
                {
                    // 1. Calculate Statutory Fee
                    string docTitle = jsonNode["documentTitle"]?.ToString() ?? "";
                    string docType = jsonNode["eFilingDocType"]?.ToString() ?? "";
                    decimal fee = CalculateStatutoryFee(docTitle, docType);
                    jsonNode["estimatedFee"] = $"${fee:0.00}";

                    // 2. Calculate Strict Clerk Prediction
                    bool isAccepted = false;
                    var warningsNode = jsonNode["warnings"];
                    
                    if (warningsNode is JsonArray warningsArray)
                    {
                        // Count how many ACTUAL warnings exist (ignoring "None", "None.", or empty strings)
                        int realWarningCount = 0;
                        foreach (var node in warningsArray)
                        {
                            string wText = node?.ToString().Trim() ?? "";
                            if (!string.IsNullOrEmpty(wText) && 
                                !wText.Equals("None", StringComparison.OrdinalIgnoreCase) &&
                                !wText.Equals("None.", StringComparison.OrdinalIgnoreCase))
                            {
                                realWarningCount++;
                            }
                        }
                        
                        // If we filtered out all the noise and have 0 real warnings, it's accepted.
                        if (realWarningCount == 0) isAccepted = true;
                    }
                    else if (warningsNode != null)
                    {
                        // Fallback in case the AI generated a plain string instead of an array
                        string wText = warningsNode.ToString().Trim();
                        if (string.IsNullOrEmpty(wText) || 
                            wText.Equals("None", StringComparison.OrdinalIgnoreCase) || 
                            wText == "[]" || 
                            wText.Contains("\"None\""))
                        {
                            isAccepted = true;
                        }
                    }

                    // Overwrite the AI's placeholder with the definitive C# truth
                    jsonNode["prediction"] = isAccepted ? "Accepted" : "Rejected";

                    return jsonNode.ToJsonString();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to inject deterministic backend logic into AI response.");
            }

            return aiMessage;
        }

        // Helper Method to ensure strict, statutory fees
        private decimal CalculateStatutoryFee(string documentTitle, string documentType)
        {
            var title = documentTitle.ToUpper();
            var type = documentType.ToUpper();

            if (title.Contains("COMPLAINT") || type.Contains("COMPLAINT")) return 435.00m;
            if (title.Contains("JURY") || type.Contains("JURY")) return 150.00m;
            if (title.Contains("MOTION") || type.Contains("MOTION")) return 60.00m;
            if (title.Contains("STIPULATION") || type.Contains("STIPULATION")) return 20.00m;

            return 0.00m; 
        }
    }
}