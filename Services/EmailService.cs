using SendGrid;
using SendGrid.Helpers.Mail;

namespace EasyFile.Services;

public interface IEmailService {
    Task SendEmailAsync(string toEmail, string subject, string body);
}

public class EmailService : IEmailService {
    private readonly IConfiguration _config;
    
    public EmailService(IConfiguration config) => _config = config;

    public async Task SendEmailAsync(string toEmail, string subject, string body) {
        try {
            Console.WriteLine($"\n[EMAIL SERVICE] Attempting SendGrid dispatch to {toEmail}...");
            
            var apiKey = _config["EmailSettings:SendGridApiKey"];
            var senderEmail = _config["EmailSettings:SenderEmail"];
            
            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(senderEmail, "EasyFile System");
            var to = new EmailAddress(toEmail);

            var msg = MailHelper.CreateSingleEmail(from, to, subject, body, body);
            
            var response = await client.SendEmailAsync(msg);
            
            if (response.IsSuccessStatusCode) {
                Console.WriteLine("[EMAIL SERVICE] SUCCESS! Email accepted by SendGrid.\n");
            } 
            else {
                var responseBody = await response.Body.ReadAsStringAsync();
                Console.WriteLine($"\n[EMAIL SERVICE ERROR] SendGrid API rejected the request. Status: {response.StatusCode}");
                Console.WriteLine($"Reason: {responseBody}\n");
            }
        }
        catch (Exception ex) {
            Console.WriteLine($"\n[EMAIL SERVICE ERROR] Code execution failed!");
            Console.WriteLine($"Reason: {ex.Message}\n");
        }
    }
}