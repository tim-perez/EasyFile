using System.ComponentModel.DataAnnotations;

namespace EasyFile.Models
{
    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        public required string Password { get; set; }
    }

    public class RegisterDto
    {
        [Required]
        public required string AccountType { get; set; }

        [Required]
        public required string FirstName { get; set; }

        [Required]
        public required string LastName { get; set; }

        public string? BusinessName { get; set; }

        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        public string? Phone { get; set; }

        [Required]
        public required string Password { get; set; }

        public string? SecretPassword { get; set; }
    }
}




// using System;

// namespace EasyFile.Models;

// public class UserRegisterDto
// {
//   public required string Username { get; set; }
//   public required string Password { get; set; }
// }

// public class UserLoginDto
// {
//   public required string Username { get; set; }
//   public required string Password { get; set; }
// }
