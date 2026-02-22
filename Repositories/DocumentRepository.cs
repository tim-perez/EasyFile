using System;
using EasyFile.Models;
using Microsoft.Data.SqlClient;
using EasyFile.Interfaces;
using Microsoft.Extensions.Configuration;

namespace EasyFile.Repositories;

public class DocumentRepository : IDocumentRepository
{
  private readonly string _connectionString;
  
  public DocumentRepository(IConfiguration configuration)
  {
    _connectionString = configuration.GetConnectionString("DefaultConnection") 
      ?? throw new InvalidOperationException("DefaultConnection string is missing.");
  }

  public async Task SaveDocumentMetadataAsync(DocumentUploadDto document, string filePath)
  {
    using (var connection = new SqlConnection(_connectionString))
    {
      var query = "INSERT INTO Documents (OrderId, Title, FileType, Tags, UploaderId, FileUrl) VALUES (@OrderId, @Title, @FileType, @Tags, @UploaderId, @FileUrl)";
      using (var command = new SqlCommand(query, connection))
      {
        command.Parameters.AddWithValue("@OrderId", document.OrderId);
        command.Parameters.AddWithValue("@Title", document.Title);
        command.Parameters.AddWithValue("@FileType", document.FileType);
        command.Parameters.AddWithValue("@Tags", document.Tags);
        command.Parameters.AddWithValue("@UploaderId", document.UploaderId);
        command.Parameters.AddWithValue("@FileUrl", filePath);

        await connection.OpenAsync();
        await command.ExecuteNonQueryAsync();
      }
    }
  }
}
