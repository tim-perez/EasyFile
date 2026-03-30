using System.IO;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EasyFile.Data;
using EasyFile.Interfaces;
using EasyFile.Models.DTOs;

namespace EasyFile.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly IDocumentService _documentService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            AppDbContext dbContext, 
            IDocumentService documentService,
            ILogger<UsersController> logger) 
        {
            _dbContext = dbContext;
            _documentService = documentService;
            _logger = logger;
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

                var user = await _dbContext.Users.FindAsync(userId);
                if (user == null) return NotFound(new { message = "User not found." });

                user.FirstName = request.FirstName;
                user.LastName = request.LastName;
                user.BusinessName = request.BusinessName;
                if (!string.IsNullOrWhiteSpace(request.Email)) user.Email = request.Email;
                user.Phone = request.Phone;

                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "Profile updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update profile for user.");
                return StatusCode(500, new { message = "An error occurred while updating the profile." });
            }
        }

        [Authorize]
        [HttpPut("password")]
        public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordDto request)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

                var user = await _dbContext.Users.FindAsync(userId);
                if (user == null) return NotFound(new { message = "User not found." });

                bool isCurrentPasswordValid = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash);
                if (!isCurrentPasswordValid)
                {
                    return BadRequest(new { message = "Incorrect current password." });
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "Password updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update password for user.");
                return StatusCode(500, new { message = "An error occurred while updating the password." });
            }
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var users = await _dbContext.Users
                    .Select(u => new { 
                        u.Id, u.FirstName, u.LastName, u.Email, u.AccountType, u.BusinessName, u.Phone, u.CreatedAt
                    })
                    .OrderByDescending(u => u.CreatedAt)
                    .ToListAsync();
                    
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve user list.");
                return StatusCode(500, new { message = "An error occurred while retrieving users." });
            }
        }

        [HttpPut("admin-update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminUpdateUser(int id, [FromBody] AdminUpdateUserDto request)
        {
            try
            {
                var user = await _dbContext.Users.FindAsync(id);
                if (user == null) return NotFound(new { message = "User not found." });

                user.FirstName = request.FirstName;
                user.LastName = request.LastName;
                user.BusinessName = request.BusinessName;
                user.Email = request.Email;
                user.Phone = request.Phone;
                user.AccountType = request.AccountType;

                await _dbContext.SaveChangesAsync();
                return Ok(new { message = "User updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Admin failed to update user {UserId}.", id);
                return StatusCode(500, new { message = "An error occurred while updating the user." });
            }
        }

        [HttpPut("admin-reset-password/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminResetPassword(int id, [FromBody] AdminResetPasswordDto request)
        {
            try
            {
                var user = await _dbContext.Users.FindAsync(id);
                if (user == null) return NotFound(new { message = "User not found." });

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                await _dbContext.SaveChangesAsync();
                
                return Ok(new { message = "Password forced reset successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Admin failed to reset password for user {UserId}.", id);
                return StatusCode(500, new { message = "An error occurred while resetting the password." });
            }
        }

        [HttpPut("admin-ban/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminBanUser(int id)
        {
            try
            {
                var user = await _dbContext.Users.FindAsync(id);
                if (user == null) return NotFound(new { message = "User not found." });

                user.AccountType = "Banned";
                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "User has been deactivated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Admin failed to ban user {UserId}.", id);
                return StatusCode(500, new { message = "An error occurred while deactivating the user." });
            }
        }

        [HttpPut("admin-unban/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminUnbanUser(int id)
        {
            try
            {
                var user = await _dbContext.Users.FindAsync(id);
                if (user == null) return NotFound(new { message = "User not found." });

                user.AccountType = "Customer";
                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "User has been reactivated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Admin failed to unban user {UserId}.", id);
                return StatusCode(500, new { message = "An error occurred while reactivating the user." });
            }
        }
    }

    public class UpdateProfileDto
    {
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public string? BusinessName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
    }

    public class UpdatePasswordDto
    {
        public required string CurrentPassword { get; set; }
        public required string NewPassword { get; set; }
    }
}