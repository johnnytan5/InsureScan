# InsureScan Deployment Guide

## Architecture Overview

InsureScan consists of two main services:

1. **Frontend (Next.js)** - Port 3000
2. **Backend (FastAPI)** - Port 8000

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL database
- uv (Python package manager)

## Installation

### 1. Install Node.js Dependencies

```powershell
# From the root directory
npm install
```

This installs dependencies for all workspaces (frontend, backend, and shared packages).

### 2. Install Python Dependencies

```powershell
# Navigate to backend directory
cd backend

# Install dependencies with uv
uv sync
```

### 3. Environment Configuration

#### Backend (.env)

Create `backend/.env` from `backend/.env.example`:

```env
# Environment
ENVIRONMENT=development
API_VERSION=v1

# Database Configuration
POSTGRES_USER=your_postgres_user
POSTGRES_HOST=your_postgres_host
POSTGRES_DB=your_postgres_database
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_PORT=5432

# AI/ML API Configuration
DASHSCOPE_API_KEY=your_dashscope_api_key

# Model Configuration
MODEL_CACHE_DIR=./models
MAX_IMAGE_SIZE=10485760  # 10MB

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000"]

# Logging
LOG_LEVEL=INFO
```

## Running the Services

### ⚡ Quick Start: Run Everything at Once (Recommended)

```bash
make dev
# or
npm run dev
```

This starts **all services**:

- Frontend on http://localhost:3000
- Backend (FastAPI) on http://localhost:8000

### Option 2: Run Each Service Individually

#### Start Backend (FastAPI)

```powershell
cd backend

# Windows
.venv\Scripts\python.exe -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Or use npm script from root
cd ..
npm run dev:backend
```

The backend API will be available at http://localhost:8000

#### Start Frontend

```powershell
cd frontend
npm run dev
```

The frontend will be available at http://localhost:3000

## Health Checks

Verify each service is running:

```powershell
# Frontend
Invoke-WebRequest http://localhost:3000

# Backend API
Invoke-WebRequest http://localhost:8000/health
```

## API Endpoints

### Backend API (Port 8000)

- `GET /health` - Backend health check
- `GET /api/claims` - List all claims
- `POST /api/claims` - Create new claim
- `GET /api/claims/:id` - Get claim by ID
- `PUT /api/claims/:id` - Update claim
- `DELETE /api/claims/:id` - Delete claim
- `POST /api/upload` - Upload files
- `POST /api/ocr` - OCR processing
- `POST /api/llm-query` - LLM queries
- `GET /api/files/:type/:name` - Retrieve uploaded files
- `POST /api/ml/detect-damage` - Detect damage in images
- `POST /api/ml/image-processing` - Process images
- `POST /api/ml/video-analysis` - Analyze videos
- `POST /api/ml/fraud-detection` - Fraud detection analysis
- `POST /api/damage/detect` - Damage detection
- `POST /api/damage/assess-severity` - Severity assessment
- `POST /api/images/enhance` - Image enhancement
- `POST /api/images/compare` - Compare two images
- `POST /api/video/analyze` - Video analysis
- `POST /api/fraud/analyze` - Fraud detection
- `POST /api/fraud/check-duplicate` - Check duplicate claims
- Interactive API docs at http://localhost:8000/docs

## Development Workflow

### Making Changes

1. **Frontend changes**: Edit files in `frontend/src/`, hot reload is automatic
2. **Backend changes**: Edit files in `backend/src/`, server restarts automatically
3. **Python changes**: Edit files in `python-services/`, FastAPI reloads with `--reload` flag
4. **Shared types**: Edit `shared/src/api.ts`, rebuild with `npm run build` in shared directory

### Building for Production

```powershell
# Build all Node.js packages
npm run build

# This builds:
# - frontend (Next.js production build)
# - backend (TypeScript compilation)
# - shared (TypeScript compilation)
```

### Running in Production

```powershell
# Start all services
npm start

# Or individually:
cd frontend && npm start      # Frontend on port 3000
cd backend && npm start       # Backend on port 3001

# Python services
cd python-services
.\make.ps1 prod  # Windows
make prod        # Linux/Mac
```

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```powershell
# Find and kill process on port 3000 (frontend)
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Backend (port 3001)
Get-NetTCPConnection -LocalPort 3001 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Python services (port 8000)
Get-NetTCPConnection -LocalPort 8000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

### Python Module Not Found

If you get "ModuleNotFoundError: No module named 'api'":

```powershell
cd python-services
uv sync  # Reinstall dependencies
```

### Backend Cannot Connect to Python Services

1. Verify Python services are running: `Invoke-WebRequest http://localhost:8000/health`
2. Check `PYTHON_SERVICES_URL` in `backend/.env`
3. Check firewall settings

### Database Connection Errors

1. Verify PostgreSQL is running
2. Check database credentials in `backend/.env`
3. Ensure database exists: `CREATE DATABASE your_database_name;`

## Project Structure

```
InsureScan/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/      # Next.js pages and routes
│   │   ├── components/  # React components
│   │   └── lib/      # Frontend utilities
│   └── package.json
│
├── backend/           # Express.js backend API
│   ├── src/
│   │   ├── routes/   # API route handlers
│   │   ├── services/ # Business logic and integrations
│   │   └── lib/      # Database and utilities
│   ├── python-services/   # Python ML services (inside backend)
│   │   ├── api/          # FastAPI application
│   │   ├── services/     # ML service implementations
│   │   ├── models/       # ML model storage
│   │   └── pyproject.toml
│   └── package.json
│
├── shared/            # Shared TypeScript types
│   └── src/
│       └── api.ts    # API type definitions
│
├── uploads/          # File upload storage
│   ├── images/
│   ├── videos/
│   └── documents/
│
├── make-python.ps1   # Python helper script (Windows)
└── Makefile-python   # Python helper script (Linux/Mac)
```

## Additional Resources

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)
- [Project Structure Documentation](./STRUCTURE.md)
- [API Testing Guide](./API-TESTING.md)
