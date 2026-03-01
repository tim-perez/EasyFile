using System.ComponentModel.DataAnnotations;

namespace EasyFile.Models
{
    public class OrderCreateDto
    {
        [Required]
        public string? Category { get; set; }
        public string? Summary { get; set; }        
    }
}