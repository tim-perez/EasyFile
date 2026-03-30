using System.Threading.Tasks;
using System.IO;

namespace EasyFile.Interfaces
{
    /// <summary>
    /// Service responsible for generating formatted PDF documents and reports.
    /// </summary>
    public interface IPdfReportService
    {
        /// <summary>
        /// Draws and compiles a secure AI Intelligence Report into a raw PDF byte array.
        /// </summary>
        byte[] GenerateReport(EasyFile.Models.Document document);
    }
}