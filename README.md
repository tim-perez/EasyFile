# EasyFile 📄

**[🚀 View Live Application: easy-file-eta.vercel.app](https://easy-file-eta.vercel.app/)**

**EasyFile** is a full-stack, cloud-native web application designed to streamline the management, uploading, and organization of legal court documents. Built as an Engineering Master's Capstone Project, it features a modern, responsive UI, robust Role-Based Access Control (RBAC), and a secure, scalable backend architecture.

## 🎥 Video Demo: AI Document Review
*Click the image below to watch a full walkthrough of EasyFile's AI-powered review system.*

[![EasyFile Demo](https://img.youtube.com/vi/IvApdUT0ICk/maxresdefault.jpg)](https://www.youtube.com/watch?v=IvApdUT0ICk)

## ✨ Features
* **Role-Based Access Control:** Distinct experiences for `Admin` and `Customer` accounts, including secure authorization codes for administrative registration.
* **Document Management:** Securely upload, track, and manage court documents with AI-assisted title generation.
* **Recycle Bin Ecosystem:** Soft-delete functionality allowing administrators to review, restore, or permanently purge files.
* **Dynamic UI:** Features modern React patterns including expandable accordion rows, floating dropdowns, and responsive grid layouts.
* **Seamless Deployment:** Fully automated CI/CD pipeline integrated with GitHub, Vercel, and Render.

## 🛠 Tech Stack
**Frontend:**
* React.js (Vite)
* Tailwind CSS (for responsive, dark-mode compatible styling)
* Deployed via Vercel

**Backend & Database:**
* C# / .NET 
* Azure SQL Database
* AWS (for secure file storage operations)
* Entity Framework Core
* Deployed via Render

## 🚀 Run Locally

EasyFile can be run locally with Docker Compose. This starts the backend API, frontend, and a local SQL Server database.

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop)
* Git
* [.NET SDK 10](https://dotnet.microsoft.com/download) only if you want to run Entity Framework commands locally

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/tim-perez/EasyFile.git
   cd EasyFile
   ```

2. **Create a local `.env` file in the project root:**
   ```bash
   LOCAL_DB_PASSWORD=EasyFile_local_123!
   AWS_ACCESS_KEY=your-aws-access-key
   AWS_SECRET_KEY=your-aws-secret-key
   AWS_REGION=your-aws-region
   AWS_BUCKET_NAME=your-bucket-name
   GMAIL_EMAIL=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-gmail-app-password
   JWT_SECRET_KEY=replace-with-a-long-random-secret
   OPENAI_API_KEY=your-openai-api-key
   ```

3. **Start the app:**
   ```bash
   docker compose up -d --build
   ```

4. **Apply database migrations:**
   ```bash
   dotnet ef database update --connection "Server=localhost,1433;Database=EasyFileLocal;User Id=sa;Password=EasyFile_local_123!;TrustServerCertificate=True;Encrypt=False;"
   ```

5. **Open the app:**
   * Frontend: [http://localhost:3000](http://localhost:3000)
   * Backend API: [http://localhost:5001](http://localhost:5001)

### Stopping the App
```bash
docker compose down
```

To remove the local database volume as well:

```bash
docker compose down -v
```

### Notes
The local Docker setup uses a SQL Server container named `easyfile-db` and a database named `EasyFileLocal`. This keeps local development separate from the production Azure SQL database.

If you change `LOCAL_DB_PASSWORD`, update the password in the migration command too.
