using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using EasyFile.Interfaces;

namespace EasyFile.Services
{
    public class AiReviewService : IAiReviewService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AiReviewService> _logger;
        private readonly string _apiKey;

        // 1. Extract the System Prompt to a constant to keep the method logic clean
        private const string SystemPrompt = @"
You are an expert California legal document classifier and e-filing assistant. Your job is to extract specific data from raw OCR text to help users e-file correctly.

CRITICAL GATEKEEPER RULE: 
If the text appears to be a receipt, menu, invoice, random picture, personal letter, or ANY non-legal document, you MUST output exactly this JSON and nothing else:
{ ""status"": ""REJECT_NON_LEGAL_DOCUMENT"" }
EXCEPTION TO GATEKEEPER: If the text contains California pleading paper line numbers (e.g., a vertical sequence of numbers from 1 to 28) or basic court headings, it IS a legal document. Do NOT reject it here. Process it normally and use the ""prediction"" and ""warnings"" keys to flag if it is blank or incomplete.

If it IS a legal document, extract the data and return a JSON object with EXACTLY these keys (do not omit any keys):
- ""documentTitle"": The exact title of the document (e.g., 'SUMMONS', 'COMPLAINT', 'CIVIL CASE COVER SHEET').
- ""eFilingDocType"": The generic e-filing category. CRITICAL RULE: If the documentTitle is short or standard (e.g., 'SUMMONS', 'JUDGMENT', 'COMPLAINT', 'ANSWER'), output that EXACT documentTitle here. ONLY genericize it if the title is long and complex, and when you do, you MUST append "" (name extension)"" to the generic title. For example, convert 'Plaintiff's Opposition to Defendant's Motion to Strike' into 'Opposition (name extension)', or 'Declaration of John Doe in Support of...' into 'Declaration (name extension)'. NEVER output 'Unknown' if you already know the documentTitle; just fall back to using the documentTitle.
- ""estimatedFee"": Estimate the filing fee. Motions are typically $60. Stipulations/Orders are $20. Summons/Complaints vary but default to $435 for unlimited. If unknown, return ""$0.00"".
- ""caseTitle"": The full case name or title. If missing, return ""Unknown"".
- ""caseNumber"": The official court case number. If missing, return """".
- ""county"": The county court jurisdiction (e.g., 'Los Angeles'). If missing, return ""Unknown"".
- ""status"": If critical fields are missing, return ""Incomplete"". Otherwise, return ""Processed"".
- ""prediction"": Output EXACTLY 'Likely Accepted' or 'Likely Rejected'. If the document is missing top-left caption information, party names, court address, or required signatures, you MUST output 'Likely Rejected'.
- ""filingType"": 'Subsequent Filing' if a case number exists, otherwise 'Case Initiation'.
- ""caseCategory"": 'CIVIL - Unlimited' if demands exceed $35,000, 'CIVIL - Limited' if under. If not civil, check if the document falls under 'FAMILY', 'PROBATE', or 'SMALL CLAIMS'. If still unclear, return ""Unknown"".
- ""caseType"": Guess the closest case type. If still unclear, return ""Unknown"".
- ""filedBy"": The party filing the document. If unclear, return ""Unknown"".
- ""refersTo"": The opposing party. If unclear, return ""Unknown"".
- ""representation"": The law firm or attorney name. If no clear representation, return ""Self-Represented"".
- ""warnings"": An array of strings containing pre-flight warnings. CRITICAL RULES:
  1. Top-Left Caption: Actively check if the Attorney Name, State Bar Number, and Address are missing (often indicated by blank pleading paper lines 1-5). If missing, warn: 'Missing Attorney/Filer Information in Top-Left Caption'.
  2. Core Data: Check for missing Court Name, Plaintiff Name, or Defendant Name.
  3. Signatures: ONLY warn about a missing signature if there is an explicit, visible signature line that is blank (e.g., 'Dated: ___ Signed: ___'). Do NOT warn about missing signatures on a first-page pleading where no signature block exists.
  If there are no warnings, return an empty array [].

Output ONLY valid raw JSON. Do NOT include markdown formatting, backticks (```), or explanations.";

        public AiReviewService(HttpClient httpClient, IConfiguration configuration, ILogger<AiReviewService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _apiKey = configuration["OpenAI:ApiKey"] 
                      ?? throw new ArgumentNullException(nameof(configuration), "OpenAI API Key is missing in appsettings.json!");
        }

        public async Task<string> GenerateDocumentReportAsync(string extractedText)
        {
            // 2. Build the request payload for OpenAI 
            var requestBody = new
            {
                model = "gpt-4o-mini",
                response_format = new { type = "json_object" },
                temperature = 0.1, 
                messages = new[]
                {
                    new { role = "system", content = SystemPrompt },
                    new { role = "user", content = $"Here is the extracted document text:\n\n{extractedText}" }
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            // 3. Setup the HTTP Request
            using var request = new HttpRequestMessage(HttpMethod.Post, "[https://api.openai.com/v1/chat/completions](https://api.openai.com/v1/chat/completions)");
            request.Headers.Add("Authorization", $"Bearer {_apiKey}");
            request.Content = jsonContent;

            // 4. Send to OpenAI and Handle Errors securely
            var response = await _httpClient.SendAsync(request);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("OpenAI API failed with status {StatusCode}. Response: {Response}", response.StatusCode, responseString);
                throw new HttpRequestException("Failed to communicate with OpenAI API.");
            }

            // 5. Parse the response
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