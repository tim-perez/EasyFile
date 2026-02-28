using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EasyFile.Api.Models; 
using EasyFile.Models;     
using EasyFile.Data;       

namespace EasyFile.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly IConfiguration _configuration;

        private const string EmployeeSecret = "EMP-SECRET-2026"; 
        private const string VendorSecret = "VND-SECRET-2026";

        public AuthController(AppDbContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            if (request.AccountType == "Employee" && request.SecretPassword != EmployeeSecret)
            {
                return Unauthorized(new { message = "Invalid Employee authorization code." });
            }
            
            if (request.AccountType == "Vendor" && request.SecretPassword != VendorSecret)
            {
                return Unauthorized(new { message = "Invalid Vendor authorization code." });
            }

            var existingUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null) return BadRequest(new { message = "Email already registered." });

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var newUser = new User 
            { 
                AccountType = request.AccountType,
                FirstName = request.FirstName,
                LastName = request.LastName,
                BusinessName = request.BusinessName,
                Email = request.Email,
                Phone = request.Phone,
                PasswordHash = passwordHash
            };

            _dbContext.Users.Add(newUser);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Registration successful." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) return Unauthorized(new { message = "Invalid credentials." });

            bool isValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!isValid) return Unauthorized(new { message = "Invalid credentials." });

            var token = GenerateJwtToken(user);

            return Ok(new { 
                token = token, 
                role = user.AccountType,
                message = "Login successful."
            });
        }

        private string GenerateJwtToken(User user)
        {
            var secretKey = _configuration["JwtSettings:SecretKey"] 
                ?? throw new InvalidOperationException("JWT Secret is missing.");
            
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

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}




// using Microsoft.AspNetCore.Mvc;
// using EasyFile.Api.Models;
// using System.Threading.Tasks;

// namespace EasyFile.Api.Controllers
// {
//     [ApiController]
//     [Route("api/[controller]")]
//     public class AuthController : ControllerBase
//     {
//         // In a production environment, these should be stored securely in appsettings.json or AWS Secrets Manager
//         private const string EmployeeSecret = "EMP-SECRET-2026"; 
//         private const string VendorSecret = "VND-SECRET-2026";

//         [HttpPost("register")]
//         public async Task<IActionResult> Register([FromBody] RegisterDto request)
//         {
//             // 1. Validate Role-Based Authorization Codes
//             if (request.AccountType == "Employee" && request.SecretPassword != EmployeeSecret)
//             {
//                 return Unauthorized(new { message = "Invalid Employee authorization code." });
//             }
            
//             if (request.AccountType == "Vendor" && request.SecretPassword != VendorSecret)
//             {
//                 return Unauthorized(new { message = "Invalid Vendor authorization code." });
//             }

//             // 2. TODO: Check if user already exists in SQL Database
//             // var existingUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
//             // if (existingUser != null) return BadRequest(new { message = "Email already registered." });

//             // 3. TODO: Hash Password securely (e.g., using BCrypt)
//             // var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

//             // 4. TODO: Map DTO to User Entity and Save to SQL Database
//             // var newUser = new User { ... };
//             // _dbContext.Users.Add(newUser);
//             // await _dbContext.SaveChangesAsync();

//             return Ok(new { message = "Registration successful." });
//         }

//         [HttpPost("login")]
//         public async Task<IActionResult> Login([FromBody] LoginDto request)
//         {
//             // 1. TODO: Fetch user from SQL Database
//             // var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
//             // if (user == null) return Unauthorized(new { message = "Invalid credentials." });

//             // 2. TODO: Verify Password
//             // bool isValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
//             // if (!isValid) return Unauthorized(new { message = "Invalid credentials." });

//             // 3. TODO: Generate secure JWT Token
//             // var token = GenerateJwtToken(user);

//             return Ok(new { 
//                 token = "sample-jwt-token-12345", 
//                 role = "Customer", // This will be dynamically pulled from the database user record
//                 message = "Login successful."
//             });
//         }
//     }
// }




// // using Microsoft.AspNetCore.Mvc;
// // using Microsoft.IdentityModel.Tokens;
// // using System.IdentityModel.Tokens.Jwt;
// // using System.Security.Claims;
// // using System.Text;
// // using EasyFile.Models;
// // using EasyFile.Data;
// // using Microsoft.EntityFrameworkCore;
// // using BCrypt.Net;

// // namespace EasyFile.Controllers
// // {
// //     [Route("api/[controller]")]
// //     [ApiController]
// //     public class AuthController : ControllerBase
// //     {
// //         private readonly AppDbContext _context;
// //         private readonly IConfiguration _configuration;

// //         public AuthController(AppDbContext context, IConfiguration configuration)
// //         {
// //             _context = context;
// //             _configuration = configuration;
// //         }

// //         [HttpPost("register")]
// //         public async Task<IActionResult> Register(UserRegisterDto request)
// //         {
// //             if (await _context.Users.AnyAsync(u => u.Username == request.Username))
// //                 return BadRequest("Username already exists.");

// //             var user = new User
// //             {
// //                 Username = request.Username,
// //                 PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
// //                 Role = "Employee"
// //             };

// //             _context.Users.Add(user);
// //             await _context.SaveChangesAsync();

// //             return Ok(new { Message = "User registered successfully." });
// //         }

// //         [HttpPost("login")]
// //         public async Task<IActionResult> Login(UserLoginDto request)
// //         {
// //             var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            
// //             if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
// //                 return Unauthorized("Invalid credentials.");

// //             var token = CreateToken(user);
// //             return Ok(new { Token = token });
// //         }

// //         private string CreateToken(User user)
// //         {
// //             var secretKey = _configuration["JwtSettings:SecretKey"] ?? throw new InvalidOperationException("JWT Secret is missing.");
// //             var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
// //             var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

// //             var claims = new[]
// //             {
// //                 new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
// //                 new Claim(ClaimTypes.Name, user.Username),
// //                 new Claim(ClaimTypes.Role, user.Role)
// //             };

// //             var token = new JwtSecurityToken(
// //                 claims: claims,
// //                 expires: DateTime.Now.AddDays(1),
// //                 signingCredentials: creds
// //             );

// //             return new JwtSecurityTokenHandler().WriteToken(token);
// //         }
// //     }
// // }