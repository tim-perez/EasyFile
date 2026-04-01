using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AutoMapper;
using EasyFile.Data;
using EasyFile.Models;
using EasyFile.Models.DTOs;
using Microsoft.AspNetCore.RateLimiting;

namespace EasyFile.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("StandardPolicy")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;

        private const string AdminSecret = "ADMIN-SECRET-2026"; 

        public AuthController(AppDbContext dbContext, IConfiguration configuration, IMapper mapper)
        {
            _dbContext = dbContext;
            _configuration = configuration;
            _mapper = mapper;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            if (request.AccountType == "Admin" && request.SecretPassword != AdminSecret)
            {
                return Unauthorized(new { message = "Invalid Admin authorization code." });
            }

            var existingUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null) 
            {
                return BadRequest(new { message = "Email already registered." });
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var newUser = _mapper.Map<User>(request);
            newUser.PasswordHash = passwordHash;

            _dbContext.Users.Add(newUser);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Registration successful." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            
            if (user == null || user.AccountType == "Banned") 
            {
                return Unauthorized(new { message = user?.AccountType == "Banned" ? "This account has been deactivated. Please contact support." : "Invalid credentials." });
            }

            bool isValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!isValid) return Unauthorized(new { message = "Invalid credentials." });

            var token = GenerateJwtToken(user);

            return Ok(new { 
                id = user.Id, token = token, role = user.AccountType,
                firstName = user.FirstName, lastName = user.LastName, email = user.Email,
                message = "Login successful."
            });
        }

        [HttpPost("guest-login")]
        public async Task<IActionResult> GuestLogin([FromBody] GuestRequestDto request) 
        {
            User? guestUser = null;

            if (!string.IsNullOrEmpty(request?.GuestEmail))
            {
                guestUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.GuestEmail && u.AccountType == "Guest");                
                
                if (guestUser != null && guestUser.AccountType == "Banned")
                {
                    return Unauthorized(new { message = "This guest account has been deactivated." });
                }
            }

            if (guestUser == null)
            {
                guestUser = new User 
                { 
                    Email = $"guest_{Guid.NewGuid().ToString().Substring(0, 8)}@easyfile.com",
                    AccountType = "Guest", FirstName = "Guest", LastName = "User", PasswordHash = "" 
                };

                _dbContext.Users.Add(guestUser);
                await _dbContext.SaveChangesAsync();
            }

            var token = GenerateJwtToken(guestUser);

            return Ok(new { 
                id = guestUser.Id, token = token, role = guestUser.AccountType, 
                firstName = guestUser.FirstName, lastName = guestUser.LastName, email = guestUser.Email,
                message = "Guest login successful."
            });
        }

        private string GenerateJwtToken(User user)
        {
            var secretKey = _configuration["JwtSettings:SecretKey"] ?? throw new InvalidOperationException("JWT Secret is missing.");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.AccountType),
                new Claim("FirstName", user.FirstName),
                new Claim("LastName", user.LastName)
            };

            var token = new JwtSecurityToken(claims: claims, expires: DateTime.UtcNow.AddHours(2), signingCredentials: creds);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}