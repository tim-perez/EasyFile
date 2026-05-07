using AutoMapper;
using EasyFile.Models;
using EasyFile.Models.DTOs;
using System.Globalization;
using System.Text.RegularExpressions;

namespace EasyFile.Mappings
{
    public class DocumentProfile : Profile
    {
        public DocumentProfile()
        {
            CreateMap<AiDocumentReportDto, Document>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status ?? "Processed"))
                .ForMember(dest => dest.DocumentTitle, opt => opt.MapFrom(src => src.DocumentTitle ?? "Unknown"))
                .ForMember(dest => dest.CaseTitle, opt => opt.MapFrom(src => src.CaseTitle ?? "Unknown"))
                .ForMember(dest => dest.CaseNumber, opt => opt.MapFrom(src => src.CaseNumber ?? "Missing"))
                .ForMember(dest => dest.County, opt => opt.MapFrom(src => src.County ?? "Unknown"))
                .ForMember(dest => dest.EFilingDocType, opt => opt.MapFrom(src => src.EFilingDocType ?? "Unknown"))
                .ForMember(dest => dest.EstimatedFee, opt => opt.MapFrom(src => src.EstimatedFee ?? "$0.00"))
                .ForMember(dest => dest.FilingType, opt => opt.MapFrom(src => src.FilingType ?? "Unknown"))
                .ForMember(dest => dest.CaseCategory, opt => opt.MapFrom(src => src.CaseCategory ?? "Unknown"))
                .ForMember(dest => dest.CaseType, opt => opt.MapFrom(src => src.CaseType ?? "Unknown"))
                .ForMember(dest => dest.FiledBy, opt => opt.MapFrom(src => src.FiledBy ?? "Unknown"))
                .ForMember(dest => dest.RefersTo, opt => opt.MapFrom(src => src.RefersTo ?? "Unknown"))
                .ForMember(dest => dest.Representation, opt => opt.MapFrom(src => src.Representation ?? "Unknown"))
                .ForMember(dest => dest.Prediction, opt => opt.MapFrom(src => NormalizePrediction(src.Prediction, src.Warnings)))
                .ForMember(dest => dest.SuggestedDocumentTypes, opt => opt.MapFrom(src =>
                    src.SuggestedDocumentTypes != null ? string.Join("|", src.SuggestedDocumentTypes) : ""))
                .ForMember(dest => dest.DocumentFee, opt => opt.MapFrom(src => ParseFee(src.EstimatedFee)))
                .ForMember(dest => dest.Warnings, opt => opt.MapFrom(src => 
                    src.Warnings != null ? string.Join("|", src.Warnings) : ""));

            CreateMap<BulkEditRequest, Document>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => 
                    srcMember != null && !(srcMember is string str && string.IsNullOrWhiteSpace(str))));
        }

        private static string NormalizePrediction(string? prediction, List<string>? warnings)
        {
            if (warnings?.Any(IsSubstantiveWarning) == true) return "Rejected";
            if (string.Equals(prediction, "Likely Rejected", StringComparison.OrdinalIgnoreCase)) return "Rejected";
            if (string.Equals(prediction, "Likely Accepted", StringComparison.OrdinalIgnoreCase)) return "Accepted";
            return prediction ?? "Unknown";
        }

        private static bool IsSubstantiveWarning(string? warning)
        {
            if (string.IsNullOrWhiteSpace(warning)) return false;

            var normalized = warning.Trim();
            return !string.Equals(normalized, "None", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(normalized, "None.", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(normalized, "(none)", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(normalized, "[]", StringComparison.OrdinalIgnoreCase);
        }

        private static decimal ParseFee(string? fee)
        {
            if (string.IsNullOrWhiteSpace(fee)) return 0m;
            var match = Regex.Match(fee, @"\d+(\.\d{1,2})?");
            return match.Success && decimal.TryParse(match.Value, NumberStyles.Number, CultureInfo.InvariantCulture, out var value)
                ? value
                : 0m;
        }
    }
}
