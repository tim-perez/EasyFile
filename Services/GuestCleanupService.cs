using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading;
using System.Threading.Tasks;
using EasyFile.Data;
using EasyFile.Interfaces;
namespace EasyFile.API.Services
{
    public class GuestCleanupService : BackgroundService
    {
        private readonly ILogger<GuestCleanupService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        private readonly TimeSpan _executionInterval = TimeSpan.FromHours(24);

        public GuestCleanupService(ILogger<GuestCleanupService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory; 
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("GuestCleanupService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("GuestCleanupService executing database cleanup at: {time}", DateTimeOffset.Now);

                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var s3Service = scope.ServiceProvider.GetRequiredService<IDocumentService>();

                        var expirationThreshold = DateTime.UtcNow.AddHours(-24);

                    }

                    _logger.LogInformation("GuestCleanupService completed successfully. Sleeping for 24 hours.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred executing the GuestCleanupService.");
                }

                await Task.Delay(_executionInterval, stoppingToken);
            }
        }
    }
}