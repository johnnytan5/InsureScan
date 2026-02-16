"""Health check router"""

from fastapi import APIRouter
from datetime import datetime
import sys

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "python_version": sys.version,
        "service": "insure-scan-python-services"
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check endpoint"""
    # Add checks for model loading, database connections, etc.
    return {
        "ready": True,
        "timestamp": datetime.utcnow().isoformat()
    }