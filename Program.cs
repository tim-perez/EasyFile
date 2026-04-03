using System;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Amazon.S3;
using Amazon.Textract;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.RateLimiting;
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
using Serilog;

// ==========================================
// 0. START SERILOG IMMEDIATELY
// ==========================================
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File("Logs/easyfile-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{

    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog();


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
    // 5. CORS POLICY (DYNAMIC)
    // ==========================================
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                        ?? Array.Empty<string>();

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("StrictCorsPolicy", policy =>
        {
            policy.WithOrigins(allowedOrigins) // <--- Injects the URLs dynamically
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials(); // Required if you ever implement Refresh Token cookies!
        });
    });

    // ==========================================
    // RATE LIMITING SECURITY
    // ==========================================
    builder.Services.AddRateLimiter(options =>
    {
        // If a user hits the limit, return a 429 (Too Many Requests) status code
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        // 1. Standard Policy (For normal API browsing)
        // Allows 100 requests per minute per IP address
        options.AddFixedWindowLimiter("StandardPolicy", opt =>
        {
            opt.Window = TimeSpan.FromMinutes(1);
            opt.PermitLimit = 100;
            opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            opt.QueueLimit = 0; // Don't queue excess requests, just reject them
        });

        // 2. Strict Upload Policy (Protects your AWS Bill)
        // Allows only 5 document uploads per minute to prevent spam
        options.AddFixedWindowLimiter("UploadPolicy", opt =>
        {
            opt.Window = TimeSpan.FromMinutes(1);
            opt.PermitLimit = 5;
            opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            opt.QueueLimit = 0;
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
    app.UseCors("StrictCorsPolicy");

    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    app.Run();
}
catch (Exception ex) when (ex.GetType().Name != "HostAbortedException")
{
    Log.Fatal(ex, "EasyFile Application terminated unexpectedly during startup.");
}
finally
{
    Log.CloseAndFlush();
}