namespace EasyFile.Models.DTOs
{
    public class LoginDto
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }

    public class RegisterDto
    {
        public required string AccountType { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public string? BusinessName { get; set; }
        public required string Email { get; set; }
        public string? Phone { get; set; }
        public required string Password { get; set; }
        public string? SecretPassword { get; set; }
    }

    public class GuestRequestDto
    {
        public string? GuestEmail { get; set; }
    }
}