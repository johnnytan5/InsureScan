"""
InsureScan Python Services - FastAPI Main Application
Provides ML inference, image processing, video analysis, and fraud detection services
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from contextlib import asynccontextmanager

from .routers import (
    damage_detection,
    image_processing,
    video_analysis,
    fraud_detection,
    health,
    claims,
    documents,
    images_db,
    videos_db,
    upload,
    files,
    llm_query,
    ocr,
)
from .config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("🚀 Starting InsureScan Python Services")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"API Version: {settings.API_VERSION}")
    yield
    logger.info("👋 Shutting down InsureScan Python Services")


# Create FastAPI app
app = FastAPI(
    title="InsureScan Python Services",
    description="ML and processing services for insurance claim validation",
    version=settings.API_VERSION,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])

# API routes for data management
app.include_router(claims.router, prefix="/api/claims", tags=["Claims"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(images_db.router, prefix="/api/images", tags=["Images"])
app.include_router(videos_db.router, prefix="/api/videos", tags=["Videos"])

# API routes for file operations
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])

# API routes for AI/ML operations
app.include_router(llm_query.router, prefix="/api/llm-query", tags=["LLM Query"])
app.include_router(ocr.router, prefix="/api/ocr", tags=["OCR"])
app.include_router(damage_detection.router, prefix="/api/ml", tags=["Damage Detection"])
app.include_router(image_processing.router, prefix="/api/image", tags=["Image Processing"])
app.include_router(video_analysis.router, prefix="/api/video", tags=["Video Analysis"])
app.include_router(fraud_detection.router, prefix="/api/fraud", tags=["Fraud Detection"])


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "InsureScan Python Services",
        "version": settings.API_VERSION,
        "status": "running",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )