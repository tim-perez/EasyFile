using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using EasyFile.Interfaces;

namespace EasyFile.Services
{
    public class AiReviewService : IAiReviewService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public AiReviewService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["OpenAI:ApiKey"] 
                      ?? throw new ArgumentNullException("OpenAI API Key is missing in appsettings.json!");
        }

        public async Task<string> GenerateDocumentReportAsync(string extractedText)
        {
            // 1. THE SYSTEM PROMPT (The Brain of your E-Filing Assistant)
        string systemPrompt = @"
You are an expert California legal document classifier and e-filing assistant. Your job is to extract specific data from raw OCR text to help users e-file correctly.

CRITICAL GATEKEEPER RULE: 
If the text appears to be a receipt, menu, invoice, random picture, personal letter, or ANY non-legal document, you MUST output exactly this JSON and nothing else:
{ ""status"": ""REJECT_NON_LEGAL_DOCUMENT"" }

If it IS a legal document, extract the data and return a JSON object with EXACTLY these keys (do not omit any keys):
- ""documentTitle"": The exact title of the document (e.g., 'SUMMONS', 'COMPLAINT', 'CIVIL CASE COVER SHEET', 'DECLARATION OF...', 'MOTION TO DISMISS', 'OPPOSITION IN SUPPORT OF...').
- ""eFilingDocType"": The generic e-filing category for the document. Typically, this will be the same as the document title. However, for example, if title is 'Notice of Jury Trial', return 'Notice'. Other Generic Title options include: Declaration, Application, Opposition, Motion, Answer, Reply, Order). If unclear, return the most likely generic type or ""Unknown"".
- ""estimatedFee"": Estimate the filing fee. Motions are typically $60. Stipulations/Orders are $20. Summons/Complaints vary but default to $435 for unlimited. If unknown, return ""$0.00"".
- ""caseTitle"": The full case name or title (e.g., 'JOHN DOE VS. RANDOM COMPANY INC., a California Corporation'). If missing, return ""Unknown"".
- ""caseNumber"": The official court case number. If missing, return """".
- ""county"": The county court jurisdiction (e.g., 'Los Angeles'). If missing, return ""Unknown"".
- ""status"": If critical fields (like signatures, unselected checkboxes, or case numbers on subsequent filings) are missing, return ""Incomplete"". Otherwise, return ""Processed"".
- ""filingType"": 'Subsequent Filing' if a case number exists, otherwise 'Case Initiation'.
- ""caseCategory"": 'CIVIL - Unlimited' if demands exceed $35,000, 'CIVIL - Limited' if under. If not civil, check if the document falls under 'FAMILY', 'PROBATE', or 'SMALL CLAIMS'. If still unclear, return ""Unknown"".
- ""caseType"": Guess the closest case type (e.g., 'Breach of contract/warranty (06)'). If the case category is FAMILY, PROBATE, or SMALL CLAIMS, use their dedicated case types. If still unclear, return ""Unknown"".
- ""filedBy"": The party filing the document (e.g., 'John Doe (Plaintiff)'). If unclear, return ""Unknown"".
- ""refersTo"": The opposing party (e.g., 'Random Company (Defendant)'). If unclear, return ""Unknown"".
- ""representation"": The law firm or attorney name. If no clear representation, return ""Self-Represented"".
- ""warnings"": An array of strings containing pre-flight warnings (e.g., ['Missing Signature', 'Attorney State Bar Number is missing', 'Checkboxes not selected', 'Address is missing']). If there are no warnings, return an empty array [].

Output ONLY valid raw JSON. Do NOT include markdown formatting, backticks (```), or explanations.";

            // 2. Build the request payload for OpenAI (Using GPT-4o-mini to save you money while remaining incredibly smart!)
            var requestBody = new
            {
                model = "gpt-4o-mini",
                response_format = new { type = "json_object" }, // FORCES valid JSON output
                temperature = 0.1, // Keeps the AI strict and analytical
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = $"Here is the extracted document text:\n\n{extractedText}" }
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            // 3. Setup the HTTP Request
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
            request.Headers.Add("Authorization", $"Bearer {_apiKey}");
            request.Content = jsonContent;

            // 4. Send it to OpenAI
            var response = await _httpClient.SendAsync(request);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[OpenAI Error] {responseString}");
                throw new Exception("Failed to communicate with OpenAI.");
            }

            // 5. Parse the response to grab just the JSON string the AI generated
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