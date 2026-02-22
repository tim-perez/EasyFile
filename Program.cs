using EasyFile.Data;
using EasyFile.Interfaces;
using EasyFile.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Amazon.S3;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
                        .AllowAnyHeader()
                        .AllowAnyMethod());
});

builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();

var awsOptions = builder.Configuration.GetAWSOptions("AWS");
awsOptions.Credentials = new Amazon.Runtime.BasicAWSCredentials(
    builder.Configuration["AWS:AccessKey"], 
    builder.Configuration["AWS:SecretKey"]);
builder.Services.AddDefaultAWSOptions(awsOptions);
builder.Services.AddAWSService<IAmazonS3>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.MapControllers(); 

app.Run();