using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AutoMapper;
using EasyFile.Data;
using EasyFile.Models;
using EasyFile.Models.DTOs;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;
using EasyFile.Services; 

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
        private readonly IEmailService _emailService;

        private const string AdminSecret = "ADMIN-SECRET-2026"; 

        public AuthController(AppDbContext dbContext, IConfiguration configuration, IMapper mapper, IEmailService emailService)
        {
            _dbContext = dbContext;
            _configuration = configuration;
            _mapper = mapper;
            _emailService = emailService;
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

            // USING THE CORRECT MODEL PROPERTIES: VerificationToken
            newUser.VerificationToken = Guid.NewGuid().ToString();
            newUser.VerificationTokenExpires = DateTime.UtcNow.AddHours(24);
            newUser.IsEmailVerified = false;

            _dbContext.Users.Add(newUser);
            await _dbContext.SaveChangesAsync();

            // GENERATE AND SEND EMAIL
            string frontendUrl = GetFrontendBaseUrl();
            string verificationLink = $"{frontendUrl}/verify-email?token={newUser.VerificationToken}";

            string emailBody = $@"
                <h2>Welcome to EasyFile!</h2>
                <p>Please confirm your email address by clicking the link below:</p>
                <a href='{verificationLink}'>Verify My Email</a>";

            await _emailService.SendEmailAsync(newUser.Email, "Verify Your EasyFile Account", emailBody);

            return Ok(new { message = "Registration successful. Please check your email to verify your account." });
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            // Find user by VerificationToken
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.VerificationToken == token);
            
            // Check if the user exists AND if the token is still valid
            if (user == null || user.VerificationTokenExpires < DateTime.UtcNow)
            {
                return BadRequest(new { message = "Invalid or expired verification token." });
            }

            // Success! Mark as verified and clear the token data
            user.IsEmailVerified = true;
            user.VerificationToken = null; 
            user.VerificationTokenExpires = null; 
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Email successfully verified! You can now log in." });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user != null && user.AccountType != "Guest" && user.AccountType != "Banned")
            {
                user.ResetPasswordToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
                user.ResetPasswordTokenExpires = DateTime.UtcNow.AddHours(1);

                await _dbContext.SaveChangesAsync();

                string frontendUrl = GetFrontendBaseUrl();
                string resetLink = $"{frontendUrl}/reset-password?token={user.ResetPasswordToken}";

                string emailBody = $@"
                    <h2>Reset Your EasyFile Password</h2>
                    <p>We received a request to reset your password. This link expires in 1 hour.</p>
                    <p><a href='{resetLink}'>Reset My Password</a></p>
                    <p>If you did not request this, you can safely ignore this email.</p>";

                await _emailService.SendEmailAsync(user.Email, "Reset Your EasyFile Password", emailBody);
            }

            return Ok(new { message = "If an account exists for that email, a password reset link has been sent." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto request)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.ResetPasswordToken == request.Token);

            if (user == null || user.ResetPasswordTokenExpires < DateTime.UtcNow)
            {
                return BadRequest(new { message = "Invalid or expired password reset token." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.ResetPasswordToken = null;
            user.ResetPasswordTokenExpires = null;

            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Password reset successfully. You can now log in." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            
            if (user == null || user.AccountType == "Banned") 
            {
                return Unauthorized(new { message = user?.AccountType == "Banned" ? "This account has been deactivated. Please contact support." : "Invalid credentials." });
            }

            // CHECK TO PREVENT UNVERIFIED LOGINS
            if (!user.IsEmailVerified)
            {
                return Unauthorized(new { message = "Please verify your email address before logging in." });
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
                    AccountType = "Guest", FirstName = "Guest", LastName = "User", PasswordHash = "",
                    IsEmailVerified = true // Guests don't need verification
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

        [HttpGet("health")]
        [AllowAnonymous]
        public async Task<IActionResult> KeepAlivePing([FromServices] AppDbContext dbContext)
        {
            try
            {
                await dbContext.Database.ExecuteSqlRawAsync("SELECT 1");
                return Ok(new { status = "Awake", timestamp = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = "Database Asleep or Error", message = ex.Message });
            }
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

        private string GetFrontendBaseUrl()
        {
            var configuredUrl = _configuration["Frontend:BaseUrl"];
            if (!string.IsNullOrWhiteSpace(configuredUrl))
            {
                return configuredUrl.TrimEnd('/');
            }

            var origin = Request.Headers.Origin.FirstOrDefault();
            return string.IsNullOrWhiteSpace(origin) ? "http://localhost:3000" : origin.TrimEnd('/');
        }
    }
}
