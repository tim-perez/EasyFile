using System;
using System.Text;
using System.Text.Json.Serialization;
using Amazon.S3;
using Amazon.Textract;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using EasyFile.Data;
using EasyFile.Interfaces;
using EasyFile.Middlewares;
using EasyFile.Services;
using FluentValidation;
using FluentValidation.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. CORE WEB SERVICES
// ==========================================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Prevents infinite loops if models reference each other
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ==========================================
// 2. EXCEPTION HANDLING
// ==========================================
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// ==========================================
// 3. DATABASE
// ==========================================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ==========================================
// 4. AUTHENTICATION & AUTHORIZATION
// ==========================================
var secretKey = builder.Configuration["JwtSettings:SecretKey"] 
    ?? throw new InvalidOperationException("JWT Secret is missing.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
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

// ==========================================
// 5. CORS POLICY
// ==========================================
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

// ==========================================
// 6. AWS SERVICES
// ==========================================
var awsOptions = builder.Configuration.GetAWSOptions("AWS");
awsOptions.Credentials = new Amazon.Runtime.BasicAWSCredentials(
    builder.Configuration["AWS:AccessKey"], 
    builder.Configuration["AWS:SecretKey"]
);

builder.Services.AddDefaultAWSOptions(awsOptions);
builder.Services.AddAWSService<IAmazonS3>();
builder.Services.AddAWSService<IAmazonTextract>();

// ==========================================
// 7. APPLICATION SERVICES & BACKGROUND TASKS
// ==========================================
builder.Services.AddHttpClient<IAiReviewService, AiReviewService>();
builder.Services.AddScoped<IDocumentService, DocumentService>(); 
builder.Services.AddScoped<ITextractService, TextractService>();
builder.Services.AddScoped<IPdfReportService, PdfReportService>();

builder.Services.AddHostedService<GuestCleanupService>();

// ==========================================
// 8. MAPPING & VALIDATION
// ==========================================
builder.Services.AddAutoMapper(cfg => 
{
    cfg.AddMaps(typeof(Program).Assembly);
});
builder.Services.AddFluentValidationAutoValidation()
                .AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();


// ==========================================
// 9. MIDDLEWARE PIPELINE
// ==========================================
var app = builder.Build();

app.UseExceptionHandler(); 

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();