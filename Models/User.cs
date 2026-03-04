using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.InteropServices;

namespace EasyFile.Models
{
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public required string AccountType { get; set; }

        [Required]
        [MaxLength(100)]
        public required string FirstName { get; set; }

        [Required]
        [MaxLength(100)]
        public required string LastName { get; set; }

        [MaxLength(200)]
        public string? BusinessName { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public required string Email { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        [Required]
        public required string PasswordHash { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [InverseProperty("Uploader")]
        public ICollection<Document> UploadedDocuments { get; set; } = new List<Document>();

        [InverseProperty("Reviewer")]
        public ICollection<Document> ReviewedDocuments { get; set; } = new List<Document>();
    }
}


// namespace EasyFile.Models
// {
//     public class User
//     {
//         public int Id { get; set; }
//         public required string Username { get; set; }
//         public required string PasswordHash { get; set; }
//         public required string Role { get; set; } = "Employee";
//         public ICollection<Order> Orders { get; set; } = new List<Order>();
//     }
// }