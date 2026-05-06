using System.IO;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EasyFile.Models;

namespace EasyFile.Data 
{
    public class AppDbContext : DbContext 
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) 
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Document> Documents { get; set; } 
        public DbSet<Submission> Submissions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Enforce unique emails at the database level
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Submission>()
                .HasIndex(s => s.SubmissionNumber)
                .IsUnique();

            modelBuilder.Entity<Submission>()
                .HasMany(s => s.Documents)
                .WithOne(d => d.Submission)
                .HasForeignKey(d => d.SubmissionId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
