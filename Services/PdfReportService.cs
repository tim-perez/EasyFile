using System;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using EasyFile.Interfaces;

namespace EasyFile.Services
{
    public class PdfReportService : IPdfReportService
    {
        public PdfReportService()
        {
            // Configure the QuestPDF Community License globally for this service
            QuestPDF.Settings.License = LicenseType.Community;
        }

        // EXPLICIT: EasyFile.Models.Document
        public byte[] GenerateReport(EasyFile.Models.Document document)
        {
            // EXPLICIT: QuestPDF.Fluent.Document
            return QuestPDF.Fluent.Document.Create(container =>
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

                        var warnings = string.IsNullOrEmpty(document.Warnings) 
                            ? Array.Empty<string>() 
                            : document.Warnings.Split('|', StringSplitOptions.RemoveEmptyEntries);

                        if (warnings.Length > 0)
                        {
                            col.Item().Background(Colors.Red.Lighten5).Padding(10).Column(warnCol =>
                            {
                                warnCol.Item().Text("PRE-FLIGHT REJECTION WARNINGS").Bold().FontColor(Colors.Red.Medium);
                                foreach (var w in warnings)
                                {
                                    warnCol.Item().PaddingTop(5).Text($"• {w}").FontColor(Colors.Red.Darken2);
                                }
                            });
                        }
                        else
                        {
                            col.Item().Background(Colors.Green.Lighten5).Padding(10).Text("No critical issues detected by AI.").FontColor(Colors.Green.Medium);
                        }

                        col.Item().Text("1. SETUP & CATEGORIZATION").Bold().FontColor(Colors.Grey.Darken3);
                        col.Item().PaddingLeft(10).Column(sub =>
                        {
                            sub.Item().Text(text => { text.Span("Case Title: ").SemiBold(); text.Span(document.CaseTitle); });
                            
                            var filingTypeDisplay = document.FilingType;
                            if (document.FilingType == "Subsequent Filing" && document.CaseNumber != "Missing")
                            {
                                filingTypeDisplay += $" ({document.CaseNumber})";
                            }
                            sub.Item().Text(text => { text.Span("Filing Type: ").SemiBold(); text.Span(filingTypeDisplay); });
                            sub.Item().Text(text => { text.Span("Case Category: ").SemiBold(); text.Span(document.CaseCategory); });
                            sub.Item().Text(text => { text.Span("Case Type: ").SemiBold(); text.Span(document.CaseType); });
                        });

                        col.Item().Text("2. PARTIES & REPRESENTATION").Bold().FontColor(Colors.Grey.Darken3);
                        col.Item().PaddingLeft(10).Column(sub =>
                        {
                            sub.Item().Text(text => { text.Span("Filed By: ").SemiBold(); text.Span(document.FiledBy); });
                            sub.Item().Text(text => { text.Span("Refers To: ").SemiBold(); text.Span(document.RefersTo); });
                            sub.Item().Text(text => { text.Span("Representation: ").SemiBold(); text.Span(document.Representation); });
                        });

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
        }
    }
}