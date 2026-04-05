# EasyFile 📄

**[🚀 View Live Application: easy-file-eta.vercel.app](https://easy-file-eta.vercel.app/)**

**EasyFile** is a full-stack, cloud-native web application designed to streamline the management, uploading, and organization of legal court documents. Built as an Engineering Master's Capstone Project, it features a modern, responsive UI, robust Role-Based Access Control (RBAC), and a secure, scalable backend architecture.

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

## 🚀 Local Development Setup

This project uses Docker to ensure a consistent development environment across all machines.

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop)
* Git

### Installation
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/tim-perez/EasyFile.git](https://github.com/EasyFile/easyfile.git)
   cd easyfile
