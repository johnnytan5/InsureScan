# InsureScan Project Structure

## Directory Layout

```
InsureScan/                       # Root directory
│
├── frontend/                     # Frontend React/Next.js application
│   ├── src/
│   │   ├── app/                 # Pages and routes
│   │   ├── components/          # React components
│   │   └── lib/                 # Frontend utilities
│   └── package.json
│
├── backend/                      # Backend services (Node.js + Python)
│   ├── src/                     # Node.js Express API
│   │   ├── routes/              # API route handlers
│   │   ├── services/            # Service integrations (including Python client)
│   │   └── lib/                 # Backend utilities
│   │
│   ├── python-services/         # Python FastAPI ML services
│   │   ├── api/                 # FastAPI application
│   │   │   ├── main.py          # FastAPI app entry point
│   │   │   ├── config.py        # Configuration
│   │   │   └── routers/         # API route modules
│   │   ├── services/            # ML service implementations
│   │   │   ├── damage_detector.py
│   │   │   ├── processor.py
│   │   │   ├── analyzer.py
│   │   │   └── detector.py
│   │   ├── models/              # ML models storage
│   │   ├── utils/               # Python utilities
│   │   ├── .venv/               # Python virtual environment
│   │   ├── pyproject.toml       # Python dependencies (uv)
│   │   ├── .env                 # Python environment config
│   │   └── README.md
│   │
│   ├── package.json
│   └── .env                     # Backend environment config
│
├── shared/                       # Shared TypeScript types
│   └── src/
│       └── api.ts
│
├── uploads/                      # File storage
│   ├── images/
│   ├── videos/
│   └── documents/
│
├── package.json                 # Root package.json (monorepo)
├── Makefile                     # Main development commands
├── DEPLOYMENT.md                # Deployment guide
└── API-TESTING.md               # API testing guide
```

## Key Changes

### ✅ What Changed

1. **Unified backend structure**: Backend services consolidated under `backend/` directory with FastAPI for Python services

### 📁 Why This Structure?

**Benefits:**

- ✅ **Logical grouping**: All backend code (Node.js + Python) is under `backend/`
- ✅ **Clear separation**: Frontend vs Backend is obvious
- ✅ **Easier navigation**: Backend developers work in one directory
- ✅ **Unified backend**: Node.js API gateway + Python ML services together
- ✅ **Root-level commands**: Python make files accessible from root

## Running the Services

### ⚡ Quick Start: Run Everything at Once (Recommended)

```bash
make dev
```

Or using npm:

```powershell
npm run dev:all
```

This starts **all 3 services** in one command:

- Frontend (port 3000)
- Backend API (port 3001)
- Python ML services (port 8000)

### Option 2: Run Node.js Services Only

```powershell
# Start frontend + backend (without Python)
npm run dev

# In another terminal: Start Python ML services separately
.\make-python.ps1 run
```

### Option 3: Run Individually

```powershell
# Frontend (Terminal 1)
cd frontend
npm run dev

# Backend Python (Terminal 2)
cd backend
.venv\Scripts\python.exe -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Or use the npm script from root:
npm run dev:backend
```

## Python Backend Commands

```powershell
# From backend directory
cd backend
uv sync                  # Install/sync dependencies
uv run pytest            # Run tests
uv run ruff check .      # Run linter
uv run ruff format .     # Format code

# Or use npm scripts from root:
npm run dev:backend      # Start development server
```

## Service Communication

```
┌───────────────┐         ┌─────────────────┐
│   Frontend    │  HTTP   │  Backend API     │
│   (Next.js)   │────────▶│  (FastAPI)      │
│   Port 3000   │         │   Port 8000      │
└───────────────┘         └─────────────────┘
     React UI             FastAPI Backend
                   (CRUD + ML + AI Services)
```

### How They Connect:

1. **Frontend → Backend**: REST API calls to `http://localhost:8000/api/*`
2. **Backend Services**: [backend/api/routers/](backend/api/routers/) - API route handlers
3. **ML Services**: [backend/services/](backend/services/) - ML inference and processing

## Environment Configuration

### Backend (.env)

```env
PORT=3001
PYTHON_SERVICES_URL=http://localhost:8000
POSTGRES_HOST=localhost
# ... other configs
```

### Python Services (.env)

```env
# Located at: backend/python-services/.env
API_PORT=8000
MODEL_CACHE_DIR=./models
ENVIRONMENT=development
```

## Development Workflow

### Making Changes

1. **Frontend changes**: Edit `frontend/src/*`, auto-reload
2. **Backend API changes**: Edit `backend/src/*`, auto-restart
3. **Python ML changes**: Edit `backend/python-services/*`, auto-reload
4. **Shared types**: Edit `shared/src/api.ts`, rebuild shared package

### Adding Python Dependencies

```powershell
# From root
cd backend/python-services
uv add package-name

# Or add to pyproject.toml and sync
.\make-python.ps1 sync  # from root
```

### Adding Node.js Dependencies

```powershell
# Backend dependencies
cd backend
npm install package-name

# Frontend dependencies
cd frontend
npm install package-name
```

## Port Reference

| Service     | Port | URL                        |
| ----------- | ---- | -------------------------- |
| Frontend    | 3000 | http://localhost:3000      |
| Backend API | 3001 | http://localhost:3001      |
| Python ML   | 8000 | http://localhost:8000      |
| Python Docs | 8000 | http://localhost:8000/docs |

## Quick Commands Reference

```bash
# Install everything
make install                             # All dependencies (Node + Python)

# Development - ONE COMMAND RUNS ALL!
make dev                                 # ⚡ Starts everything at once

# Or using npm
npm run dev:all                          # Same as make dev

# Run individual services
make frontend                            # Frontend only
make backend                             # Backend only
make python                              # Python ML only

# Health checks
Invoke-WebRequest http://localhost:3000  # Frontend
Invoke-WebRequest http://localhost:3001/health  # Backend
Invoke-WebRequest http://localhost:8000/health  # Python

# Build for production
npm run build                            # Node.js services
cd backend/python-services && uv build   # Python package (if needed)
```

## Troubleshooting

### Python services won't start from make file

Try running directly:

```powershell
cd backend/python-services
.\.venv\Scripts\python.exe -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Can't find Python modules

Re-sync dependencies:

```powershell
cd backend/python-services
uv sync
```

### VS Code can't find Python modules

Update `.vscode/settings.json` Python path:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/python-services/.venv/Scripts/python.exe"
}
```

Already updated in the project!

## Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [API-TESTING.md](./API-TESTING.md) - API testing examples
- [README.md](./README.md) - Main project overview
- [backend/python-services/README.md](./backend/python-services/README.md) - Python services docs
