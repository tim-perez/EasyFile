using System.Net;
using System.Net.Mail;

namespace EasyFile.Services;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string body);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        try
        {
            Console.WriteLine($"\n[EMAIL SERVICE] Attempting to send email to {toEmail}...");

            var email = _config["EmailSettings:SenderEmail"];
            var pass = _config["EmailSettings:AppPassword"];

            using var client = new SmtpClient("smtp.gmail.com", 465)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(email, pass),
                DeliveryMethod = SmtpDeliveryMethod.Network,
                Timeout = 10000
            };

            Console.WriteLine("[EMAIL SERVICE] Connecting to Gmail SMTP...");

            using var message = new MailMessage
            {
                From = new MailAddress(email!, "EasyFile"),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            message.To.Add(toEmail);

            await client.SendMailAsync(message);

            Console.WriteLine("[EMAIL SERVICE] SUCCESS! Email accepted by Google.\n");
        }
        catch (SmtpException ex)
        {
            Console.WriteLine("\n[EMAIL SERVICE ERROR] SMTP failure");
            Console.WriteLine($"StatusCode: {ex.StatusCode}");
            Console.WriteLine($"Message: {ex.Message}");

            if (ex.InnerException != null)
                Console.WriteLine($"Inner: {ex.InnerException.Message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine("\n[EMAIL SERVICE ERROR] General failure");
            Console.WriteLine(ex.Message);

            if (ex.InnerException != null)
                Console.WriteLine(ex.InnerException.Message);
        }
    }
}