using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using EasyFile.Data;

namespace EasyFile.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public OrdersController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token." });
            }

            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (userRole == "Customer")
            {
                // TODO: Fetch orders placed by this specific customer
                // var orders = await _dbContext.Orders.Where(o => o.CustomerId == userId).ToListAsync();
                return Ok(new { message = "Customer orders retrieved.", userId, role = userRole });
            }
            else if (userRole == "Employee" || userRole == "Vendor")
            {
                // TODO: Fetch orders pending review or assigned to this employee/vendor
                // var orders = await _dbContext.Orders.Where(o => o.Status == "PendingReview").ToListAsync();
                return Ok(new { message = "Reviewable orders retrieved.", userId, role = userRole });
            }

            return Forbid();
        }
    }
}