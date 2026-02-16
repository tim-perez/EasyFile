using System;
using System.Reflection.Metadata;

namespace EasyFile.Models;

public class Order
{
  public int OrderId { get; set; }
  public int UserId { get; set; }
  public string Category { get; set; } = string.Empty;
  public string Status { get; set; } = "Pending";
  public string Summary { get; set; } = string.Empty;
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  public User? User { get; set; }
  public List<Document> Documents { get; set; } = new();
}
