using System;

namespace EasyFile.Models;

public class User
{
  public int UserId { get; set; }
  public string Username { get; set; } = string.Empty;
  public string Role { get; set; } = "Contributor";

  public List<Order> Orders { get; set; } = new();
}
