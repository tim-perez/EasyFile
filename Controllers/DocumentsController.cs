using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System;
using System.Threading.Tasks;
using System.Text.Json;
using System.Linq;
using System.IO.Compression;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using EasyFile.Data;
using EasyFile.Models;
using EasyFile.Interfaces;

namespace EasyFile.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly IDocumentService _documentService;
        private readonly ITextractService _textractService;
        private readonly IAiReviewService _aiReviewService;

        public DocumentsController(
            AppDbContext dbContext,
            IDocumentService documentService,
            ITextractService textractService,
            IAiReviewService aiReviewService)
        {
            _dbContext = dbContext;
            _documentService = documentService;
            _textractService = textractService;
            _aiReviewService = aiReviewService;
        }

        // ==========================================
        // 1. UPLOAD AND EXTRACT DATA
        // ==========================================
        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument(IFormFile file, [FromForm] string userId)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "No file uploaded." });

                var originalFileName = file.FileName;

                // 1. Upload to S3
                var fileKey = await _documentService.UploadDocumentAsync(file, userId);

                // 2. Extract Text via AWS Textract
                using var fileStream = file.OpenReadStream();
                var extractedText = await _textractService.ExtractTextAsync(fileStream);

                // ==========================================
                // 🛑 GATEKEEPER 1: NON-TEXT SEARCHABLE CHECK
                // ==========================================
                // If Textract found almost no text, it's likely a blurry photo or a flattened image.
                if (string.IsNullOrWhiteSpace(extractedText) || extractedText.Length < 50)
                {
                    Console.WriteLine("\n=== GATEKEEPER 1 TRIGGERED ===");
                    Console.WriteLine($"File {originalFileName} failed text extraction.");

                    var failedDocument = new EasyFile.Models.Document
                    {
                        UploaderId = int.Parse(userId),
                        FileName = originalFileName,
                        DocumentTitle = "Non-Text Searchable", // Tell the user exactly what went wrong
                        CaseNumber = "Missing",
                        FileUrl = fileKey,
                        FileType = file.ContentType,
                        Status = "Failed", // This will make your React badge turn red!
                        County = "Unknown"
                    };

                    _dbContext.Documents.Add(failedDocument);
                    await _dbContext.SaveChangesAsync();

                    // We return Ok so it still shows up in the user's table, but with the Failed status.
                    return Ok(new { message = "Document saved, but flagged as non-text searchable.", documentId = failedDocument.Id });
                }

                // 3. Send text to AI and get JSON back
                var aiReportJson = await _aiReviewService.GenerateDocumentReportAsync(extractedText);

                Console.WriteLine("\n=== OPENAI JSON RESPONSE ===");
                Console.WriteLine(aiReportJson);
                Console.WriteLine("=============================\n");

                // 4. Safely Parse the JSON
                using JsonDocument jsonDoc = JsonDocument.Parse(aiReportJson);
                var root = jsonDoc.RootElement;

                var aiStatus = root.TryGetProperty("status", out var statusProp) ? statusProp.GetString() : "Processed";

                // ==========================================
                // 🛑 GATEKEEPER 2: NON-LEGAL DOCUMENT CHECK
                // ==========================================
                // If the AI flags this as an Amazon invoice or a dog picture...
                if (aiStatus == "REJECT_NON_LEGAL_DOCUMENT")
                {
                    Console.WriteLine("\n=== GATEKEEPER 2 TRIGGERED ===");
                    Console.WriteLine($"File {originalFileName} rejected by AI as non-legal.");

                    // 1. Delete the junk file from AWS S3 immediately so you don't pay for storage
                    await _documentService.DeleteDocumentAsync(fileKey);

                    // 2. Return a 400 Bad Request to trigger the error alert in React
                    return BadRequest(new { message = "Upload Failed: The uploaded file is not recognized as a valid legal document." });
                }

                // 5. Safely Parse all JSON fields
                var aiTitle = root.TryGetProperty("documentTitle", out var titleProp) ? titleProp.GetString() : "Unknown";
                var aiCaseTitle = root.TryGetProperty("caseTitle", out var caseTitleProp) ? caseTitleProp.GetString() : "Unknown";
                var aiCaseNumber = root.TryGetProperty("caseNumber", out var caseProp) ? caseProp.GetString() : "Missing";
                var aiCounty = root.TryGetProperty("county", out var countyProp) ? countyProp.GetString() : "Unknown";
                var aiPrediction = root.TryGetProperty("prediction", out var predProp) ? predProp.GetString() : "Unknown";
                
                // NEW: E-Filing specific fields
                var aiEFilingDocType = root.TryGetProperty("eFilingDocType", out var eTypeProp) ? eTypeProp.GetString() : "Unknown";
                var aiEstimatedFee = root.TryGetProperty("estimatedFee", out var feeProp) ? feeProp.GetString() : "$0.00";
                var aiFilingType = root.TryGetProperty("filingType", out var fTypeProp) ? fTypeProp.GetString() : "Unknown";
                var aiCaseCategory = root.TryGetProperty("caseCategory", out var catProp) ? catProp.GetString() : "Unknown";
                var aiCaseType = root.TryGetProperty("caseType", out var cTypeProp) ? cTypeProp.GetString() : "Unknown";
                var aiFiledBy = root.TryGetProperty("filedBy", out var filedProp) ? filedProp.GetString() : "Unknown";
                var aiRefersTo = root.TryGetProperty("refersTo", out var refersProp) ? refersProp.GetString() : "Unknown";
                var aiRepresentation = root.TryGetProperty("representation", out var repProp) ? repProp.GetString() : "Unknown";
                
                // Convert warnings array to a single string for easy database storage
                var aiWarnings = root.TryGetProperty("warnings", out var warnProp) && warnProp.ValueKind == JsonValueKind.Array 
                    ? string.Join("|", warnProp.EnumerateArray().Select(w => w.GetString())) 
                    : "";

                var newDocument = new EasyFile.Models.Document
                {
                    UploaderId = int.Parse(userId),
                    FileName = originalFileName ?? "Unknown_File.pdf",
                    DocumentTitle = aiTitle ?? "Unknown",
                    CaseTitle = aiCaseTitle ?? "Unknown",
                    CaseNumber = aiCaseNumber ?? "Missing",
                    FileUrl = fileKey ?? "Missing_URL",
                    FileType = file.ContentType ?? "application/pdf",
                    Status = aiStatus ?? "Processed",
                    County = aiCounty ?? "Unknown",
                    
                    // NEW: Save them to the database
                    EFilingDocType = aiEFilingDocType ?? "Unknown",
                    EstimatedFee = aiEstimatedFee ?? "$0.00",
                    FilingType = aiFilingType ?? "Unknown",
                    CaseCategory = aiCaseCategory ?? "Unknown",
                    CaseType = aiCaseType ?? "Unknown",
                    FiledBy = aiFiledBy ?? "Unknown",
                    RefersTo = aiRefersTo ?? "Unknown",
                    Representation = aiRepresentation ?? "Unknown",
                    Prediction = aiPrediction ?? "Unknown", // NEW: Save prediction
                    Warnings = aiWarnings
                };

                _dbContext.Documents.Add(newDocument);
                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "Upload and AI analysis complete!", documentId = newDocument.Id });
            }
            catch (Exception ex)
            {
                var actualError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, new { message = "An error occurred.", error = actualError });
            }
        }

        // ==========================================
        // 2. GET ALL DOCUMENTS FOR THE TABLE
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> GetDocuments()
        {
            try
            {
                var documents = await _dbContext.Documents
                    .Where(d => d.Recycled == false) // NEW: Hide recycled documents!
                    .OrderByDescending(d => d.CreatedAt)
                    .ToListAsync();
                    
                return Ok(documents);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch documents.", error = ex.Message });
            }
        }

        // ==========================================
        // 3. GET SECURE AWS LINK FOR VIEWING
        // ==========================================
        [HttpGet("{id}/url")]
        public async Task<IActionResult> GetDocumentUrl(int id)
        {
            try
            {
                var doc = await _dbContext.Documents.FindAsync(id);
                if (doc == null) return NotFound(new { message = "Document not found." });

                // Notice we are using doc.FileUrl here!
                var url = await _documentService.GetDocumentPresignedUrlAsync(doc.FileUrl);
                
                return Ok(new { url = url });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Could not generate link.", error = ex.Message });
            }
        }

        // ==========================================
        // 4. SOFT DELETE A DOCUMENT
        // ==========================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            try
            {
                var doc = await _dbContext.Documents.FindAsync(id);
                if (doc == null) return NotFound(new { message = "Document not found." });

                // NEW: Soft Delete Logic! 
                // We do NOT delete from AWS S3 here. We just tag it for the Recycle Bin.
                doc.Recycled = true;
                doc.DeletedAt = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "Document moved to recycle bin." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to delete document.", error = ex.Message });
            }
        }

        // ==========================================
        // 5. GET RECYCLED DOCUMENTS
        // ==========================================
        [HttpGet("recycle")]
        public async Task<IActionResult> GetRecycledDocuments()
        {
            try
            {
                var documents = await _dbContext.Documents
                    .Where(d => d.Recycled == true) // ONLY grab the recycled ones!
                    .OrderByDescending(d => d.DeletedAt) // Order by when they were deleted
                    .ToListAsync();
                    
                return Ok(documents);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch recycled documents.", error = ex.Message });
            }
        }

        // ==========================================
        // 6. RESTORE A DOCUMENT
        // ==========================================
        [HttpPost("{id}/restore")]
        public async Task<IActionResult> RestoreDocument(int id)
        {
            try
            {
                var doc = await _dbContext.Documents.FindAsync(id);
                if (doc == null) return NotFound(new { message = "Document not found." });

                // Un-tag the document and clear the deleted date
                doc.Recycled = false;
                doc.DeletedAt = null;

                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "Document restored successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to restore document.", error = ex.Message });
            }
        }

        // ==========================================
        // 7. PERMANENTLY DELETE A DOCUMENT (The Shredder)
        // ==========================================
        [HttpDelete("{id}/permanent")]
        public async Task<IActionResult> HardDeleteDocument(int id)
        {
            try
            {
                var doc = await _dbContext.Documents.FindAsync(id);
                if (doc == null) return NotFound(new { message = "Document not found." });

                // 1. Permanently delete from AWS S3
                try 
                {
                    await _documentService.DeleteDocumentAsync(doc.FileUrl);
                }
                catch (Exception s3Ex)
                {
                    Console.WriteLine($"S3 Delete Warning: {s3Ex.Message}");
                }

                // 2. Erase record from SQL entirely
                _dbContext.Documents.Remove(doc);
                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "Document permanently deleted." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to permanently delete.", error = ex.Message });
            }
        }

        [HttpGet("{id}/report/download")]
        public async Task<IActionResult> DownloadReport(int id)
        {
            try
            {
                // 1. Find the specific document in the database
                var document = await _dbContext.Documents.FindAsync(id);
                if (document == null)
                    return NotFound(new { message = "Document not found." });

                // 2. Configure QuestPDF (Required for the free Community tier)
                QuestPDF.Settings.License = LicenseType.Community;

                // 3. Draw the PDF Document
                var pdfBytes = QuestPDF.Fluent.Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.Letter);
                        page.Margin(1, Unit.Inch);
                        page.PageColor(Colors.White);
                        page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Arial).FontColor(Colors.Black));

                        // --- HEADER ---
                        page.Header().Column(col =>
                        {
                            col.Item().Text("EasyFile Intelligence Report").SemiBold().FontSize(20).FontColor(Colors.Blue.Darken2);
                            col.Item().Text($"Source Document: {document.FileName}").FontSize(10).FontColor(Colors.Grey.Medium);
                            col.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                        });

                        // --- BODY ---
                        page.Content().PaddingVertical(15).Column(col =>
                        {
                            col.Spacing(15);

                            // 🔴 WARNINGS SECTION
                            col.Item().Background(Colors.Red.Lighten5).Padding(10).Column(warnCol =>
                            {
                                warnCol.Item().Text("PRE-FLIGHT REJECTION WARNINGS").Bold().FontColor(Colors.Red.Medium);
                                
                                var warnings = string.IsNullOrEmpty(document.Warnings) ? Array.Empty<string>() : document.Warnings.Split('|', StringSplitOptions.RemoveEmptyEntries);
                                
                                if (warnings.Length > 0)
                                {
                                    foreach(var w in warnings)
                                    {
                                        warnCol.Item().PaddingTop(5).Text($"• {w}").FontColor(Colors.Red.Darken2);
                                    }
                                }
                                else
                                {
                                    warnCol.Item().PaddingTop(5).Text("No critical issues detected by AI.").FontColor(Colors.Green.Medium);
                                }
                            });

                            // 🏛 SECTION 1: SETUP
                            col.Item().Text("1. SETUP & CATEGORIZATION").Bold().FontColor(Colors.Grey.Darken3);
                            col.Item().PaddingLeft(10).Column(sub =>
                            {
                                sub.Item().Text(text => { text.Span("Case Title: ").SemiBold(); text.Span(document.CaseTitle); });
                                
                                // Handle the special Subsequent Filing logic!
                                var filingTypeDisplay = document.FilingType;
                                if (document.FilingType == "Subsequent Filing" && document.CaseNumber != "Missing")
                                {
                                    filingTypeDisplay += $" ({document.CaseNumber})";
                                }
                                sub.Item().Text(text => { text.Span("Filing Type: ").SemiBold(); text.Span(filingTypeDisplay); });
                                
                                sub.Item().Text(text => { text.Span("Case Category: ").SemiBold(); text.Span(document.CaseCategory); });
                                sub.Item().Text(text => { text.Span("Case Type: ").SemiBold(); text.Span(document.CaseType); });
                            });

                            // ⚖️ SECTION 2: PARTIES
                            col.Item().Text("2. PARTIES & REPRESENTATION").Bold().FontColor(Colors.Grey.Darken3);
                            col.Item().PaddingLeft(10).Column(sub =>
                            {
                                sub.Item().Text(text => { text.Span("Filed By: ").SemiBold(); text.Span(document.FiledBy); });
                                sub.Item().Text(text => { text.Span("Refers To: ").SemiBold(); text.Span(document.RefersTo); });
                                sub.Item().Text(text => { text.Span("Representation: ").SemiBold(); text.Span(document.Representation); });
                            });

                            // 📑 SECTION 3: SPECIFICS
                            col.Item().Text("3. DOCUMENT SPECIFICS").Bold().FontColor(Colors.Grey.Darken3);
                            col.Item().PaddingLeft(10).Column(sub =>
                            {
                                sub.Item().Text(text => { text.Span("E-Filing Doc Type: ").SemiBold(); text.Span(document.EFilingDocType).FontColor(Colors.Blue.Medium); });
                                sub.Item().Text(text => { text.Span("Exact Title: ").SemiBold(); text.Span(document.DocumentTitle); });
                                sub.Item().Text(text => { text.Span("Estimated Fee: ").SemiBold(); text.Span(document.EstimatedFee); });
                            });
                        });

                        // --- FOOTER ---
                        page.Footer().Column(f =>
                        {
                            f.Item().AlignCenter().PaddingBottom(5).Text("Disclaimer: This report is generated by AI and is intended for informational purposes only. It does constitute legal advice.").FontSize(8).FontColor(Colors.Grey.Medium).Italic();
                            f.Item().AlignCenter().Text(x =>
                            {
                                x.Span("Generated by EasyFile AI • Page ");
                                x.CurrentPageNumber();
                                x.Span(" of ");
                                x.TotalPages();
                            });
                        });
                    });
                }).GeneratePdf(); // This command compiles the drawing into a raw PDF byte array!

                // 4. Return the file securely to React
                var sanitizedFileName = $"{document.FileName ?? "Legal_Document"}_AI_Report.pdf";
                return File(pdfBytes, "application/pdf", sanitizedFileName);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PDF Gen Error] {ex.Message}");
                return StatusCode(500, new { message = "Failed to generate PDF report." });
            }
        }

        // ==========================================
        // 8. BULK EDIT DOCUMENTS
        // ==========================================
        [HttpPut("bulk-edit")]
        public async Task<IActionResult> BulkEditDocuments([FromBody] BulkEditRequest request)
        {
            try
            {
                if (request.DocumentIds == null || !request.DocumentIds.Any())
                    return BadRequest(new { message = "No documents selected for editing." });

                // Fetch all selected documents that aren't in the recycle bin
                var documents = await _dbContext.Documents
                    .Where(d => request.DocumentIds.Contains(d.Id) && d.Recycled == false)
                    .ToListAsync();

                if (!documents.Any())
                    return NotFound(new { message = "None of the selected documents were found." });

                // Update only the fields that the user actually typed in!
                foreach (var doc in documents)
                {
                    if (!string.IsNullOrWhiteSpace(request.FileName)) doc.FileName = request.FileName;
                    if (!string.IsNullOrWhiteSpace(request.DocumentTitle)) doc.DocumentTitle = request.DocumentTitle;
                    if (!string.IsNullOrWhiteSpace(request.CaseNumber)) doc.CaseNumber = request.CaseNumber;
                    if (!string.IsNullOrWhiteSpace(request.County)) doc.County = request.County;
                }

                await _dbContext.SaveChangesAsync();

                return Ok(new { message = $"Successfully updated {documents.Count} document(s)." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update documents.", error = ex.Message });
            }
        }
        // ==========================================
        // 9. BULK DOWNLOAD REPORTS (ZIP)
        // ==========================================
        [HttpPost("bulk-download/reports")]
        public async Task<IActionResult> BulkDownloadReports([FromBody] BulkDownloadRequest request)
        {
            try
            {
                var documents = await _dbContext.Documents
                    .Where(d => request.DocumentIds.Contains(d.Id) && d.Recycled == false)
                    .ToListAsync();

                if (!documents.Any()) return NotFound(new { message = "No documents found." });

                // Create a ZIP file in memory
                using var memoryStream = new MemoryStream();
                using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                {
                    foreach (var doc in documents)
                    {
                        // Note: To keep your code clean, I recommend moving your QuestPDF drawing logic 
                        // into a private method called GenerateReportPdf(doc) later, but for now 
                        // we can generate it inline just like your single download!
                        
                        QuestPDF.Settings.License = LicenseType.Community;
                        var pdfBytes = QuestPDF.Fluent.Document.Create(container =>
                        {
                            container.Page(page =>
                            {
                                page.Size(PageSizes.Letter);
                                page.Margin(1, Unit.Inch);
                                page.PageColor(Colors.White);
                                page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Arial).FontColor(Colors.Black));

                                // HEADER
                                page.Header().Column(col =>
                                {
                                    col.Item().Text("EasyFile Intelligence Report").SemiBold().FontSize(20).FontColor(Colors.Blue.Darken2);
                                    col.Item().Text($"Source Document: {doc.FileName}").FontSize(12).FontColor(Colors.Grey.Darken2);
                                    col.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                                });

                                // CONTENT
                                page.Content().PaddingVertical(15).Column(col =>
                                {
                                    // WARNINGS SECTION
                                    if (doc.Warnings != null && doc.Warnings.Any())
                                    {
                                        col.Item().PaddingBottom(15).Background(Colors.Red.Lighten5).Padding(10).Column(wCol =>
                                        {
                                            wCol.Item().Text("PRE-FLIGHT REJECTION WARNINGS").SemiBold().FontColor(Colors.Red.Medium);
                                            foreach (var warning in doc.Warnings)
                                            {
                                                wCol.Item().Text($"• {warning}").FontColor(Colors.Red.Darken2).FontSize(10);
                                            }
                                        });
                                    }

                                    // 1. SETUP & CATEGORIZATION
                                    col.Item().PaddingBottom(5).Text("1. SETUP & CATEGORIZATION").SemiBold().FontSize(12);
                                    col.Item().PaddingBottom(15).Row(row =>
                                    {
                                        row.RelativeItem().Column(c =>
                                        {
                                            c.Item().Text($"Case Title: {doc.CaseTitle}");
                                            c.Item().Text($"Filing Type: {doc.FilingType}");
                                            c.Item().Text($"Case Category: {doc.CaseCategory}");
                                        });
                                        row.RelativeItem().Column(c =>
                                        {
                                            c.Item().Text($"Case Type: {doc.CaseType}");
                                        });
                                    });

                                    // 2. PARTIES & REPRESENTATION
                                    col.Item().PaddingBottom(5).Text("2. PARTIES & REPRESENTATION").SemiBold().FontSize(12);
                                    col.Item().PaddingBottom(15).Column(c =>
                                    {
                                        c.Item().Text($"Filed By: {doc.FiledBy}");
                                        c.Item().Text($"Refers To: {doc.RefersTo}");
                                        c.Item().Text($"Representation: {doc.Representation}");
                                    });

                                    // 3. DOCUMENT SPECIFICS
                                    col.Item().PaddingBottom(5).Text("3. DOCUMENT SPECIFICS").SemiBold().FontSize(12);
                                    col.Item().Column(c =>
                                    {
                                        // Note: Ensure these property names match your Document model exactly!
                                        c.Item().Text($"E-Filing Doc Type: {doc.EFilingDocType}"); 
                                        c.Item().Text($"Exact Title: {doc.DocumentTitle}");
                                        c.Item().Text($"Estimated Fee: {doc.EstimatedFee}");
                                    });
                                });

                                // FOOTER WITH DISCLAIMER
                                page.Footer().Column(f =>
                                {
                                    f.Item().AlignCenter().PaddingBottom(5).Text("Disclaimer: This report is generated by AI and is intended for informational purposes only. It does not constitute legal advice.").FontSize(8).FontColor(Colors.Grey.Medium).Italic();
                                    f.Item().AlignCenter().Text(x =>
                                    {
                                        x.Span("Generated by EasyFile AI • Page ");
                                        x.CurrentPageNumber();
                                        x.Span(" of ");
                                        x.TotalPages();
                                    });
                                });
                            });
                        }).GeneratePdf();

                        // Add the PDF to the ZIP file
                        var safeName = $"{doc.FileName ?? "Document"}_Report.pdf";
                        var zipEntry = archive.CreateEntry(safeName, CompressionLevel.Fastest);
                        using var zipStream = zipEntry.Open();
                        zipStream.Write(pdfBytes, 0, pdfBytes.Length);
                    }
                }

                memoryStream.Seek(0, SeekOrigin.Begin);
                return File(memoryStream.ToArray(), "application/zip", "EasyFile_Reports.zip");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to generate reports zip.", error = ex.Message });
            }
        }

        // ==========================================
        // 10. BULK DOWNLOAD ORIGINAL FILES (ZIP)
        // ==========================================
        [HttpPost("bulk-download/files")]
        public async Task<IActionResult> BulkDownloadOriginalFiles([FromBody] BulkDownloadRequest request)
        {
            try
            {
                var documents = await _dbContext.Documents
                    .Where(d => request.DocumentIds.Contains(d.Id) && d.Recycled == false)
                    .ToListAsync();

                if (!documents.Any()) return NotFound(new { message = "No documents found." });

                using var memoryStream = new MemoryStream();
                using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                {
                    using var httpClient = new HttpClient(); // We use this to fetch from your secure S3 links

                    foreach (var doc in documents)
                    {
                        try 
                        {
                            // 1. Get the secure AWS S3 link
                            var url = await _documentService.GetDocumentPresignedUrlAsync(doc.FileUrl);
                            
                            // 2. Download the file bytes from AWS
                            var fileBytes = await httpClient.GetByteArrayAsync(url);
                            
                            // 3. Add it to the ZIP
                            var safeName = doc.FileName ?? $"Unknown_Document_{doc.Id}.pdf";
                            var zipEntry = archive.CreateEntry(safeName, CompressionLevel.Fastest);
                            using var zipStream = zipEntry.Open();
                            zipStream.Write(fileBytes, 0, fileBytes.Length);
                        }
                        catch (Exception)
                        {
                            // If one file fails (e.g. deleted from AWS), skip it so the whole zip doesn't crash
                            Console.WriteLine($"Failed to fetch {doc.FileName} from S3.");
                        }
                    }
                }

                memoryStream.Seek(0, SeekOrigin.Begin);
                return File(memoryStream.ToArray(), "application/zip", "EasyFile_Originals.zip");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to zip original files.", error = ex.Message });
            }
        }
    }
    public class BulkEditRequest
    {
        public List<int> DocumentIds { get; set; } = new List<int>();
        public string? FileName { get; set; }
        public string? DocumentTitle { get; set; }
        public string? CaseNumber { get; set; }
        public string? County { get; set; }
    }

    public class BulkDownloadRequest
    {
        public List<int> DocumentIds { get; set; } = new List<int>();
    }
}