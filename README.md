# EasyFile 📄

**[🚀 View Live Application: easy-file-eta.vercel.app](https://easy-file-eta.vercel.app/)**

**EasyFile** functions as a full-stack, cloud-native web application designed to streamline the management, uploading, and organization of legal court documents. Developed as an Engineering Master's Capstone Project, it features a modern, responsive UI, robust Role-Based Access Control (RBAC), and a secure, scalable backend architecture.

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

Developers run EasyFile locally with Docker Compose. This starts the backend API, frontend, and a local SQL Server database.

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop)
* Git
* [.NET SDK 10](https://dotnet.microsoft.com/download) only if you want to run Entity Framework commands locally

### Installation
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/tim-perez/EasyFile.git](https://github.com/tim-perez/EasyFile.git)
   cd EasyFile