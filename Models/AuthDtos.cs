using System;

namespace EasyFile.Models;

public class UserRegisterDto
{
  public required string Username { get; set; }
  public required string Password { get; set; }
}

public class UserLoginDto
{
  public required string Username { get; set; }
  public required string Password { get; set; }
}
