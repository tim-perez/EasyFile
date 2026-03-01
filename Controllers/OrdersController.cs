// Controllers/OrdersController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System;
using System.Threading.Tasks;
using EasyFile.Data;
using EasyFile.Models;

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

        [HttpPost("create")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDto request)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int customerId))
            {
                return Unauthorized(new { message = "Invalid user token." });
            }

            var newOrder = new Order
            {
                UserId = customerId,
                Category = request.Category!, // DTO validation ensures this is not null
                Summary = request.Summary ?? "",
                Status = "PendingReview",
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Orders.Add(newOrder);
            await _dbContext.SaveChangesAsync();

            return Ok(new { 
                message = "Order created successfully.", 
                orderId = newOrder.OrderId 
            });
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
                // Updated to use UserId
                var orders = await _dbContext.Orders.Where(o => o.UserId == userId).ToListAsync();
                return Ok(new { message = "Customer orders retrieved.", orders });
            }
            else if (userRole == "Employee" || userRole == "Vendor")
            {
                var orders = await _dbContext.Orders.Where(o => o.Status == "PendingReview").ToListAsync();
                return Ok(new { message = "Reviewable orders retrieved.", orders });
            }

            return Forbid();
        }
    }
}