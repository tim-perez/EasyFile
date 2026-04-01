using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using EasyFile.Data;
using EasyFile.Interfaces;
using EasyFile.Models.DTOs;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using EasyFile.Models.Pagination;

namespace EasyFile.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly IDocumentService _documentService;
        private readonly ILogger<UsersController> _logger;
        private readonly IMapper _mapper;

        public UsersController(
            AppDbContext dbContext, 
            IDocumentService documentService,
            ILogger<UsersController> logger,
            IMapper mapper) 
        {
            _dbContext = dbContext;
            _documentService = documentService;
            _logger = logger;
            _mapper = mapper;
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

                _mapper.Map(request, user);

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
        public async Task<IActionResult> GetAllUsers([FromQuery] UserQueryParameters queryParams)
        {
            try
            {
                var query = _dbContext.Users.AsQueryable();

                // 1. Apply Role Filter
                if (!string.IsNullOrWhiteSpace(queryParams.RoleFilter) && queryParams.RoleFilter != "All")
                {
                    query = query.Where(u => u.AccountType == queryParams.RoleFilter);
                }

                // 2. Apply Search Filter
                if (!string.IsNullOrWhiteSpace(queryParams.SearchTerm))
                {
                    var search = queryParams.SearchTerm.ToLower();
                    bool isNumeric = int.TryParse(search, out int searchId);

                    query = query.Where(u => 
                        (isNumeric && u.Id == searchId) ||
                        (u.FirstName != null && u.FirstName.ToLower().Contains(search)) ||
                        (u.LastName != null && u.LastName.ToLower().Contains(search)) ||
                        (u.Email != null && u.Email.ToLower().Contains(search))
                    );
                }

                // 3. Count total records BEFORE paginating
                var totalCount = await query.CountAsync();

                // 4. Apply Server-Side Sorting
                bool isDesc = queryParams.SortDirection?.ToLower() == "desc";
                query = queryParams.SortColumn?.ToLower() switch
                {
                    "id" => isDesc ? query.OrderByDescending(u => u.Id) : query.OrderBy(u => u.Id),
                    "name" => isDesc ? query.OrderByDescending(u => u.FirstName).ThenByDescending(u => u.LastName) : query.OrderBy(u => u.FirstName).ThenBy(u => u.LastName),
                    "accounttype" => isDesc ? query.OrderByDescending(u => u.AccountType) : query.OrderBy(u => u.AccountType),
                    _ => isDesc ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt)
                };

                // 5. Apply Pagination and Select only needed fields
                var users = await query
                    .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                    .Take(queryParams.PageSize)
                    .Select(u => new { 
                        u.Id, u.FirstName, u.LastName, u.Email, u.AccountType, u.BusinessName, u.Phone, u.CreatedAt
                    })
                    .ToListAsync();

                // 6. Return the standard wrapper
                var result = new PagedResult<object>
                {
                    Items = users.Cast<object>().ToList(),
                    TotalCount = totalCount,
                    PageNumber = queryParams.PageNumber,
                    PageSize = queryParams.PageSize
                };

                return Ok(result);
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

                _mapper.Map(request, user);

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
}