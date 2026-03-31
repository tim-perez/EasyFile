using FluentValidation;
using EasyFile.Models.DTOs;

namespace EasyFile.Validators
{
    public class UpdateProfileDtoValidator : AbstractValidator<UpdateProfileDto>
    {
        public UpdateProfileDtoValidator()
        {
            RuleFor(x => x.FirstName).NotEmpty().WithMessage("First name is required.");
            RuleFor(x => x.LastName).NotEmpty().WithMessage("Last name is required.");
            RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))
                                 .WithMessage("A valid email is required.");
        }
    }

    public class UpdatePasswordDtoValidator : AbstractValidator<UpdatePasswordDto>
    {
        public UpdatePasswordDtoValidator()
        {
            RuleFor(x => x.CurrentPassword).NotEmpty().WithMessage("Current password is required.");
            RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(6).WithMessage("New password must be at least 6 characters.");
        }
    }

    public class AdminUpdateUserDtoValidator : AbstractValidator<AdminUpdateUserDto>
    {
        public AdminUpdateUserDtoValidator()
        {
            RuleFor(x => x.FirstName).NotEmpty();
            RuleFor(x => x.LastName).NotEmpty();
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
            RuleFor(x => x.AccountType).NotEmpty();
        }
    }

    public class AdminResetPasswordDtoValidator : AbstractValidator<AdminResetPasswordDto>
    {
        public AdminResetPasswordDtoValidator()
        {
            RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(6).WithMessage("New password must be at least 6 characters.");
        }
    }
}