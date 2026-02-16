# InsureScan Backend API

Python FastAPI backend for InsureScan insurance claim processing platform.

## 🚀 Features

### Core API

- **Claims Management** - CRUD operations for insurance claims
- **Document Management** - Document upload and retrieval
- **Image Management** - Image records and metadata
- **Video Management** - Video records and processing
- **File Upload/Serving** - File storage and retrieval

### AI/ML Services

- **Damage Detection** - ML-based vehicle damage detection and severity assessment
- **Image Processing** - Image enhancement, metadata extraction, and comparison
- **Video Analysis** - Video frame extraction and damage assessment
- **Fraud Detection** - ML-powered fraud pattern detection and risk scoring
- **OCR** - Optical character recognition using Vision LLM
- **LLM Query** - Natural language processing and queries

### Database

- **PostgreSQL** - Async database operations with psycopg3

## 🏗️ Architecture

```
backend/
├── api/                    # FastAPI application
│   ├── main.py            # Main FastAPI app
│   ├── config.py          # Configuration
│   └── routers/           # API endpoints
│       ├── claims.py      # Claims CRUD
│       ├── documents.py   # Documents API
│       ├── images_db.py   # Images API
│       ├── videos_db.py   # Videos API
│       ├── upload.py      # File upload
│       ├── files.py       # File serving
│       ├── llm_query.py   # LLM queries
│       ├── ocr.py         # OCR processing
│       ├── damage_detection.py
│       ├── image_processing.py
│       ├── video_analysis.py
│       └── fraud_detection.py
├── lib/                   # Libraries
│   └── database.py        # PostgreSQL utilities
├── services/              # Core ML services
│   ├── ml_inference/
│   ├── image_processing/
│   ├── video_analysis/
│   └── fraud_detection/
├── models/                # Trained ML models
├── utils/                 # Shared utilities
├── pyproject.toml         # Dependencies (uv)
└── .venv/                 # Virtual environment
```

## 📋 Prerequisites

- Python 3.11 or higher
- [uv](https://github.com/astral-sh/uv) package manager
- (Optional) CUDA-capable GPU for ML inference

## 🛠️ Installation

From the project root, install dependencies:

```bash
make install
```

Or from the backend directory:

```bash
cd backend
uv sync
```

## 🚀 Running the Server

### Development Mode

From project root:

```bash
make dev          # Runs both frontend and backend
make backend      # Backend only
```

From backend directory:

```bash
uv run uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
cd backend
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:

- **API:** http://localhost:8000
- **Documentation:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

## 📡 API Endpoints

### Core Data API

- `GET /api/claims` - List all claims (with optional status filter)
- `POST /api/claims` - Create a new claim
- `GET /api/claims/{id}` - Get claim details
- `PATCH /api/claims/{id}` - Update claim
- [DEPLOYMENT.md](../docs/DEPLOYMENT.md) - Deployment guide
- [STRUCTURE.md](../docs/STRUCTURE.md) - Project structure
- [API-TESTING.md](../docs/API-TESTING.md) - API testing examples
- `DELETE /api/claims/{id}` - Delete claim
- `GET /api/documents` - Get documents by claim_id
- `POST /api/documents` - Create document record
- `GET /api/images` - Get images by claim_id
- `POST /api/images` - Create image record
- `GET /api/videos` - Get videos by claim_id
- `POST /api/videos` - Create video record

### File Operations

- `POST /api/upload` - Upload files (documents, images, videos)
- `GET /api/files/{type}/{name}` - Serve uploaded files

### AI/ML Services

- `POST /api/llm-query` - Query LLM with text input
- `POST /api/ocr` - OCR on images using Vision LLM
- `POST /api/ocr/test` - Test OCR with driver info extraction
- `POST /api/ml/detect-damage` - Detect damage in image
- `POST /api/ml/assess-severity` - Assess damage severity
- `POST /api/image/enhance` - Enhance image quality
- `POST /api/video/analyze` - Analyze video for damage
- `POST /api/fraud/analyze-claim` - Fraud detection

### System

- `GET /health` - Service health status
- `GET /` - API info

## 🔧 Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=insurescan
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# API Keys
DASHSCOPE_API_KEY=your_api_key_here
BASE_URL=http://localhost:8000

# Server
PORT=8000
HOST=0.0.0.0
```

## 📦 Dependencies

Core dependencies:

- **FastAPI** - Modern async web framework
- **psycopg3** - PostgreSQL database driver
- **OpenAI** - LLM integration
- **Pillow** - Image processing
- **OpenCV** - Computer vision
- **PyTorch** - Deep learning
- **Transformers** - NLP models
- **uvicorn** - ASGI server

See `pyproject.toml` for full dependency list.

## 🧠 ML Models

Place your trained models in the `models/` directory:

```
models/
├── damage_detector.pth
├── fraud_detector.pkl
└── severity_classifier.onnx
```

## 🐛 Development

```bash
# Install dependencies
cd backend
uv sync

# Run development server with auto-reload
uv run uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Format code (if black is installed)
uv run black .

# Lint code (if ruff is installed)
uv run ruff check .

# Clean cache files
find . -type d -name __pycache__ -exec rm -rf {} +
```

## 📄 License

Part of the InsureScan project.
