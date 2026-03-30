using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace EasyFile.Middlewares;

/// <summary>
/// Intercepts unhandled exceptions across the application to provide standardized, 
/// secure JSON error responses (ProblemDetails) to the client.
/// </summary>
public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Handles the exception, logs the stack trace internally, and writes a safe response to the HTTP context.
    /// </summary>
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        // 1. Always log the actual raw error and stack trace to your internal server logs
        _logger.LogError(exception, "An unhandled exception occurred: {Message}", exception.Message);

        // 2. Prepare a safe, generic response for the frontend
        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Internal Server Error",
            Detail = "An unexpected error occurred on our end. Our team has been notified." 
        };

        // 3. Override with specific details ONLY for known, safe exception types
        if (exception is ArgumentException)
        {
            problemDetails.Status = StatusCodes.Status400BadRequest;
            problemDetails.Title = "Bad Request";
            problemDetails.Detail = exception.Message; // It is usually safe to show Argument validation errors
        }

        // 4. Return the standardized ProblemDetails JSON
        httpContext.Response.StatusCode = problemDetails.Status.Value;
        httpContext.Response.ContentType = "application/problem+json";
        
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true; // Return true to indicate the exception has been successfully handled
    }
}