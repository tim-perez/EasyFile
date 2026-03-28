using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using EasyFile.Data;
using EasyFile.Interfaces;

namespace EasyFile.Services
{
    public class GuestCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;

        public GuestCleanupService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // This loop runs endlessly in the background while your server is online
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var documentService = scope.ServiceProvider.GetRequiredService<IDocumentService>();

                    // 1. Find guests created more than 24 hours ago
                    var expirationDate = DateTime.UtcNow.AddHours(-24);
                    
                    var expiredGuests = await dbContext.Users
                        .Where(u => u.AccountType == "Guest" && u.CreatedAt < expirationDate)
                        .Include(u => u.UploadedDocuments)
                        .ToListAsync(stoppingToken);

                    foreach (var guest in expiredGuests)
                    {
                        // 2. Delete all their files from AWS S3 first
                        foreach (var doc in guest.UploadedDocuments)
                        {
                            try {
                                await documentService.DeleteDocumentAsync(doc.FileUrl);
                            } catch (Exception ex) {
                                Console.WriteLine($"Failed to delete S3 file for expired guest: {ex.Message}");
                            }
                        }
                        
                        // 3. Delete the guest from the SQL database (which automatically deletes their SQL document records)
                        dbContext.Users.Remove(guest);
                    }

                    if (expiredGuests.Any())
                    {
                        await dbContext.SaveChangesAsync(stoppingToken);
                        Console.WriteLine($"\n[CLEANUP] Automatically wiped {expiredGuests.Count} expired guest accounts and their files from AWS & SQL.\n");
                    }
                }

                // 4. Go to sleep for 1 hour, then wake up and check again
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }
}