using EasyFile.Models;
using EasyFile.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using EasyFile.Interfaces;

namespace EasyFile.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IDocumentService _documentService; // <-- Add this

        // <-- Update constructor
        public UsersController(AppDbContext context, IDocumentService documentService) 
        {
            _context = context;
            _documentService = documentService;
        }

        // --- Existing Endpoints ---
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }
        
        [HttpPost]
        public async Task<ActionResult<User>> CreateUser(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsers), new { id = user.Id }, user);
        }

        // ==========================================
        // NEW: PROFILE UPDATE ENDPOINT
        // ==========================================
        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
        {
            // Extract the User ID from the secure JWT token
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

            // Find the user in the database
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound(new { message = "User not found." });

            // Update the allowed fields
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.BusinessName = request.BusinessName;
            if (request.Email != null) user.Email = request.Email;
            user.Phone = request.Phone;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully." });
        }

        // ==========================================
        // NEW: PASSWORD UPDATE ENDPOINT
        // ==========================================
        [Authorize]
        [HttpPut("password")]
        public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordDto request)
        {
            // Extract the User ID from the secure JWT token
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

            // Find the user in the database
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound(new { message = "User not found." });

            // Verify the current password using BCrypt
            bool isCurrentPasswordValid = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash);
            if (!isCurrentPasswordValid)
            {
                return BadRequest(new { message = "Incorrect current password." });
            }

            // Hash the new password and save
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password updated successfully." });
        }

        // ==========================================
        // ADMIN: GET ALL USERS
        // ==========================================
        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            // We omit the PasswordHash so it never travels over the network
            var users = await _context.Users
                .Select(u => new { 
                    u.Id, u.FirstName, u.LastName, u.Email, u.AccountType, u.BusinessName, u.Phone, u.CreatedAt
                })
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
                
            return Ok(users);
        }

        // ==========================================
        // ADMIN: UPDATE USER DETAILS
        // ==========================================
        [HttpPut("admin-update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminUpdateUser(int id, [FromBody] AdminUpdateUserDto request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found." });

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.BusinessName = request.BusinessName;
            user.Email = request.Email;
            user.Phone = request.Phone;
            user.AccountType = request.AccountType;

            await _context.SaveChangesAsync();
            return Ok(new { message = "User updated successfully." });
        }

        // ==========================================
        // ADMIN: FORCE PASSWORD RESET
        // ==========================================
        [HttpPut("admin-reset-password/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminResetPassword(int id, [FromBody] AdminResetPasswordDto request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found." });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();
            
            return Ok(new { message = "Password forced reset successfully." });
        }

        // ==========================================
        // ADMIN: PERMANENTLY DELETE USER
        // ==========================================
        [HttpDelete("admin-delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminDeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found." });

            // 1. Wipe their AWS S3 Folder so we leave no orphaned files
            await _documentService.DeleteUserFolderAsync(user.Id.ToString());

            // 2. Wipe them from SQL (This instantly cascade-deletes all their SQL document records too!)
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User and all associated data permanently deleted." });
        }
    }

    // ==========================================
    // DATA TRANSFER OBJECTS (DTOs)
    // ==========================================
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

    public class AdminUpdateUserDto
    {
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public string? BusinessName { get; set; }
        public required string Email { get; set; }
        public string? Phone { get; set; }
        public required string AccountType { get; set; }
    }

    public class AdminResetPasswordDto
    {
        public required string NewPassword { get; set; }
    }
}