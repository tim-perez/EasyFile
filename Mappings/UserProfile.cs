using AutoMapper;
using EasyFile.Models;
using EasyFile.Models.DTOs;

namespace EasyFile.Mappings
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            // This single line tells AutoMapper to match properties by name.
            CreateMap<RegisterDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());
        }
    }
}