# InsureScan - Insurance Claim Processing Platform

An insurance claim processing platform with Python FastAPI backend and Next.js frontend.

## 📚 Documentation

- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Complete deployment and running guide
- **[SUPABASE_MIGRATION.md](./docs/SUPABASE_MIGRATION.md)** - Supabase database setup and migration guide
- **[STRUCTURE.md](./docs/STRUCTURE.md)** - Detailed project structure and commands reference
- **[API-TESTING.md](./docs/API-TESTING.md)** - API testing examples and scenarios
- **[SUPABASE_QUICKSTART.md](./docs/SUPABASE_QUICKSTART.md)** - Quick start guide for Supabase
- **[Python Backend README](./backend/README.md)** - Backend API documentation

## Project Structure

```
InsureScan/
├── backend/                  # Python FastAPI backend
│   ├── api/                 # FastAPI application & routers
│   │   ├── main.py         # Main FastAPI app
│   │   ├── config.py       # Configuration settings
│   │   └── routers/        # API route handlers
│   ├── lib/                # Backend utilities (database)
│   ├── services/           # ML service implementations
│   ├── models/             # ML models storage
│   ├── utils/              # Python utilities
│   ├── pyproject.toml      # Python dependencies (uv)
│   └── .venv/              # Python virtual environment
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # React components
│   │   └── lib/           # Frontend utilities and API client
│   ├── package.json
│   └── next.config.ts
├── uploads/               # File storage directory
└── Makefile               # Main development commands
```

## Tech Stack

### Backend (Python)

- **FastAPI** - Modern async Python web framework
- **Supabase (PostgreSQL)** - Cloud database with psycopg3
- **OpenAI** - LLM integration for OCR and queries
- **PIL/OpenCV** - Image processing
- **PyTorch/Transformers** - ML models
- **uvicorn** - ASGI server

### Frontend (Next.js)

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Three.js** - 3D visualizations

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.11 or higher)
- Supabase account and project (free tier available)
- uv (Python package manager)

### Installation

1. **Install all dependencies:**

   ```bash
   make install
   ```

   Or manually:

   ```bash
   # Install Node.js dependencies
   npm install

   # Install Python dependencies
   cd backend
   uv sync
   ```

2. **Set up environment variables:**

   ```bash
   # Backend environment
   cp backend/.env.example backend/.env

   # Frontend environment
   cp frontend/.env.example frontend/.env
   ```

   Update the `.env` files with your database credentials, API keys, and other configuration.

### Development

**Quick Start - Run Everything:**

```bash
make dev
```

This starts:

- Frontend on `http://localhost:3000`
- Python Backend API on `http://localhost:8000`

**Or run services individually:**

```bash
# Backend only
make backend

# Frontend only
make frontend
```

**Available Make Commands:**

```bash
make help      # Show all available commands
make install   # Install all dependencies
make clean     # Clean build artifacts and caches
```

### API Endpoints

Once running, you can access:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs (Swagger UI)
- **API Health Check:** http://localhost:8000/health

### Key API Routes

- `/api/claims` - CRUD operations for insurance claims
- `/api/documents` - Document management
- `/api/images` - Image upload and processing
- `/api/videos` - Video upload and analysis
- `/api/upload` - File upload endpoint
- `/api/llm-query` - LLM queries
- `/api/ocr` - Optical character recognition
- `/api/ml/*` - ML damage detection
- `/api/fraud` - Fraud detection

### Production Build

```bash
# Build frontend
cd frontend
npm run build
npm start
```

For Python backend, use production ASGI server:

```bash
cd backend
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000
```

## Features

### Frontend

- Next.js 15 with App Router
- React 19 with TypeScript
- Tailwind CSS styling
- Radix UI components
- Three.js 3D visualization
- Responsive design

### Backend (Python FastAPI)

- RESTful API with async support
- Supabase PostgreSQL database (psycopg3)
- File upload handling
- OCR with Vision LLM
- LLM integration (Qwen models)
- ML damage detection
- Fraud analysis
- CORS middleware
- Auto-generated API docs (Swagger/ReDoc)

## Environment Variables

### Backend (.env)

See [SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md) for detailed setup instructions.

```env
# Supabase Database
SUPABASE_DB_HOST=aws-0-us-east-1.pooler.supabase.com
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres.nkdequnbswxtzqdoosps
SUPABASE_DB_PASSWORD=your_password
SUPABASE_DB_SSLMODE=require

SUPABASE_PROJECT_REF=nkdequnbswxtzqdoosps
SUPABASE_URL=https://nkdequnbswxtzqdoosps.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# API Keys
DASHSCOPE_API_KEY=your_api_key
BASE_URL=http://localhost:8000

# Server
PORT=8000
HOST=0.0.0.0
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## License

MIT

---

For more detailed information, see:

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [STRUCTURE.md](./STRUCTURE.md) - Project structure
- [API-TESTING.md](./API-TESTING.md) - API testing examples

1. Make changes in the appropriate package (frontend, backend, or shared)
2. Update types in the shared package if needed
3. Test both frontend and backend functionality
4. Update documentation as necessary

## Migration Notes

- All API routes have been converted from Next.js API routes to Express.js routes
- Frontend now uses an API client to communicate with the backend
- Database connections are handled exclusively by the backend
- File uploads now go through the Express.js backend
- Shared types are available in the `shared` package for consistency
