using System;
using EasyFile.Models;

namespace EasyFile.Interfaces;

public interface IDocumentRepository
{
  Task SaveDocumentMetadataAsync(DocumentUploadDto document, string filePath);
}
