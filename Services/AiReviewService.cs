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

            var messages = new List<ChatMessage>
            {
                new SystemChatMessage(
                    "You are an expert legal document analyzer. " +
                    "Step 1: Determine if the provided text is from a valid legal document (e.g., court filing, affidavit, contract, subpoena). " +
                    "If the text is NOT a legal document (e.g., a recipe, a random photo, blank pages, casual conversation), reply EXACTLY and ONLY with the phrase: 'REJECT_NON_LEGAL_DOCUMENT'. " +
                    "Step 2: If it IS a legal document, extract the key details in a clean, bulleted list. Include items like Case Name, Case Number, and Document Title. If a detail is missing, state 'Not Found'."
                ),
                new UserChatMessage($"Here is the document text to review:\n\n{documentText}")
            };

            var response = await client.CompleteChatAsync(messages);
            return response.Value.Content[0].Text;
            */
            // =====================================================================

            // 1. Simulate the time it takes for AI to "think" so your frontend animation still plays!
            await Task.Delay(2000);

            // 2. Return a beautifully formatted fake AI report
            return @"**Simulated AI Legal Review**
- **Case Name:** Smith v. Jones (Mock Data)
- **Case Number:** 2026-CV-12345 (Mock Data)
- **Document Title:** Plaintiff's Original Petition (Mock Data)
- **Filing Date:** March 20, 2026
- **Status:** APPROVED

*Note: This is a simulated response to bypass the OpenAI quota during development.*";
        }
    }
}