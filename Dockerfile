# STAGE 1: Build the app using the heavy .NET 10 SDK
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies
COPY ["EasyFile.csproj", "./"]
RUN dotnet restore "./EasyFile.csproj"

# Copy the rest of the code and compile it
COPY . .
RUN dotnet publish "EasyFile.csproj" -c Release -o /app/publish /p:UseAppHost=false

# STAGE 2: Run the app using the lightweight ASP.NET Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose the standard .NET container port
EXPOSE 8080

# Start the application
ENTRYPOINT ["dotnet", "EasyFile.dll"]