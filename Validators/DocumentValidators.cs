using FluentValidation;
using EasyFile.Models.DTOs;

namespace EasyFile.Validators
{
    public class BulkEditRequestValidator : AbstractValidator<BulkEditRequest>
    {
        public BulkEditRequestValidator()
        {
            RuleFor(x => x.DocumentIds)
                .NotEmpty()
                .WithMessage("You must select at least one document to edit.");
        }
    }

    public class BulkDownloadRequestValidator : AbstractValidator<BulkDownloadRequest>
    {
        public BulkDownloadRequestValidator()
        {
            RuleFor(x => x.DocumentIds)
                .NotEmpty()
                .WithMessage("You must select at least one document to download.");
        }
    }
}