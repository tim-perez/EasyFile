namespace EasyFile.Models
{
    public class User
    {
        public int Id { get; set; }
        public required string Username { get; set; }
        public required string PasswordHash { get; set; }
        public required string Role { get; set; } = "Employee";
        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}