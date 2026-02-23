using System;
using EasyFile.Models;

namespace EasyFile.Interfaces;

public interface IDocumentService
{
  Task<string> UploadDocumentAsync(DocumentUploadDto uploadDto);
}
