using System.Net;
using System.Net.Mail;

namespace EasyFile.Services;

public interface IEmailService {
    Task SendEmailAsync(string toEmail, string subject, string body);
}

public class EmailService : IEmailService {
    private readonly IConfiguration _config;
    public EmailService(IConfiguration config) => _config = config;

    public async Task SendEmailAsync(string toEmail, string subject, string body) {
        try {
            Console.WriteLine($"\n[EMAIL SERVICE] Attempting to send email to {toEmail}...");
            
            var email = _config["EmailSettings:SenderEmail"];
            var pass = _config["EmailSettings:AppPassword"];
            var host = _config["EmailSettings:SmtpServer"];
            var port = int.Parse(_config["EmailSettings:SmtpPort"] ?? "587");
            
            using var client = new SmtpClient(host, port) {
                EnableSsl = true,
                Credentials = new NetworkCredential(email, pass),
                Timeout = 20000, 
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false
            };

            var message = new MailMessage(email!, toEmail, subject, body) { IsBodyHtml = true };
            
            await client.SendMailAsync(message); 
            
            Console.WriteLine("[EMAIL SERVICE] SUCCESS! Email accepted by Google.\n");
        }
        catch (Exception ex) {
            Console.WriteLine($"\n[EMAIL SERVICE ERROR] Email dispatch failed!");
            Console.WriteLine($"Reason: {ex.Message}");
            if (ex.InnerException != null) Console.WriteLine($"Inner Detail: {ex.InnerException.Message}\n");
        }
    }
}