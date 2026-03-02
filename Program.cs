using Microsoft.EntityFrameworkCore;
using EasyFile.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var secretKey = builder.Configuration["JwtSettings:SecretKey"] 
        ?? throw new InvalidOperationException("JWT Secret is missing.");
        
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();


// using EasyFile.Data;
// using EasyFile.Interfaces;
// using EasyFile.Repositories;
// using Microsoft.EntityFrameworkCore;
// using System.Text.Json.Serialization;
// using Amazon.S3;
// using EasyFile.Middlewares;
// using EasyFile.Services;
// using Microsoft.AspNetCore.Authentication.JwtBearer;
// using Microsoft.IdentityModel.Tokens;
// using System.Text;

// var builder = WebApplication.CreateBuilder(args);

// builder.Services.AddEndpointsApiExplorer();
// builder.Services.AddSwaggerGen();

// builder.Services.AddControllers().AddJsonOptions(options =>
// {
//     options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
// });

// builder.Services.AddDbContext<AppDbContext>(options =>
//     options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// builder.Services.AddCors(options =>
// {
//     options.AddPolicy("AllowReactApp",
//         policy => policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
//                         .AllowAnyHeader()
//                         .AllowAnyMethod());
// });

// builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();

// var awsOptions = builder.Configuration.GetAWSOptions("AWS");
// awsOptions.Credentials = new Amazon.Runtime.BasicAWSCredentials(
//     builder.Configuration["AWS:AccessKey"], 
//     builder.Configuration["AWS:SecretKey"]);
// builder.Services.AddDefaultAWSOptions(awsOptions);
// builder.Services.AddAWSService<IAmazonS3>();

// builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
// builder.Services.AddProblemDetails();
// builder.Services.AddScoped<IDocumentService, DocumentService>();

// builder.Services.AddAuthentication(options =>
// {
//     options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
//     options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
// })
// .AddJwtBearer(options =>
// {
//     var secretKey = builder.Configuration["JwtSettings:SecretKey"] 
//         ?? throw new InvalidOperationException("JWT Secret is missing.");
        
//     options.TokenValidationParameters = new TokenValidationParameters
//     {
//         ValidateIssuer = false, // Can be enabled later for strict domain checking
//         ValidateAudience = false,
//         ValidateLifetime = true,
//         ValidateIssuerSigningKey = true,
//         IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
//     };
// });

// builder.Services.AddAuthorization();

// var app = builder.Build();

// if (app.Environment.IsDevelopment())
// {
//     app.UseSwagger();
//     app.UseSwaggerUI();
// }

// app.UseHttpsRedirection();

// app.UseCors("AllowReactApp");

// app.UseExceptionHandler();

// app.UseAuthentication(); 
// app.UseAuthorization();

// app.MapControllers(); 

// app.Run();