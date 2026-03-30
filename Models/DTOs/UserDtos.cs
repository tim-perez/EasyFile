namespace EasyFile.Models.DTOs
{
    public class UpdateProfileDto
    {
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public string? BusinessName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
    }

    public class UpdatePasswordDto
    {
        public required string CurrentPassword { get; set; }
        public required string NewPassword { get; set; }
    }

    public class AdminUpdateUserDto
    {
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public string? BusinessName { get; set; }
        public required string Email { get; set; }
        public string? Phone { get; set; }
        public required string AccountType { get; set; }
    }

    public class AdminResetPasswordDto
    {
        public required string NewPassword { get; set; }
    }
}