using AutoMapper;
using EasyFile.Models;
using EasyFile.Models.DTOs;

namespace EasyFile.Mappings
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            // Registration Mapping
            CreateMap<RegisterDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());

            // Profile Update Mapping (Only maps the email if it's not empty!)
            CreateMap<UpdateProfileDto, User>()
                .ForMember(dest => dest.Email, opt => 
                {
                    opt.PreCondition(src => !string.IsNullOrWhiteSpace(src.Email));
                    opt.MapFrom(src => src.Email);
                });

            // Admin Update Mapping
            CreateMap<AdminUpdateUserDto, User>();
        }
    }
}