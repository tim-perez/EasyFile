using System;

namespace EasyFile.Models;

public class Document
{
  public int Id { get; set; }
  public int OrderId { get; set; }
  public string Title { get; set; } = string.Empty;
  public string FileType { get; set; } = string.Empty;
  public DateTime CreatedAt { get; set; }
  public string Tags { get; set; } = string.Empty;
  public int UploaderId { get; set; }
  public string FileUrl { get; set; } = string.Empty;

  public Order? Order { get; set; }
}
