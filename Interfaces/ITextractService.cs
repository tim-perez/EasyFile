using System.IO;
using System.Threading.Tasks;

namespace EasyFile.Interfaces
{
    public interface ITextractService
    {
        // We pass the uploaded file as a data stream, and it returns the raw text
        Task<string> ExtractTextAsync(Stream fileStream);
    }
}