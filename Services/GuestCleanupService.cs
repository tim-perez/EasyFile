using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using EasyFile.Data;
using EasyFile.Interfaces;

namespace EasyFile.Services
{
    /// <summary>
    /// A background worker service that periodically scans for and securely purges 
    /// expired guest accounts and their associated files from AWS S3 and the database.
    /// </summary>
    public class GuestCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<GuestCleanupService> _logger;

        public GuestCleanupService(IServiceProvider serviceProvider, ILogger<GuestCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("GuestCleanupService has started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await PurgeExpiredGuestsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    // Catching the exception here ensures the background service doesn't crash 
                    // permanently if there is a momentary database connection issue.
                    _logger.LogError(ex, "An error occurred while executing the guest cleanup task.");
                }

                // Wait 1 hour before running the next cleanup cycle
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }

            _logger.LogInformation("GuestCleanupService is stopping.");
        }

        private async Task PurgeExpiredGuestsAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var documentService = scope.ServiceProvider.GetRequiredService<IDocumentService>();

            var expirationDate = DateTime.UtcNow.AddHours(-24);
            
            var expiredGuests = await dbContext.Users
                .Include(u => u.UploadedDocuments)
                .Where(u => u.AccountType == "Guest" && u.CreatedAt < expirationDate)
                .ToListAsync(stoppingToken);

            if (!expiredGuests.Any()) return;

            foreach (var guest in expiredGuests)
            {
                // Securely purge all physical files associated with the user from AWS S3
                await documentService.DeleteUserFolderAsync(guest.Id.ToString());
                
                // Remove the user (and cascaded SQL document records) from the database
                dbContext.Users.Remove(guest);
            }

            await dbContext.SaveChangesAsync(stoppingToken);
            
            _logger.LogInformation("Successfully purged {Count} expired guest accounts and their associated AWS/SQL data.", expiredGuests.Count);
        }
    }
}