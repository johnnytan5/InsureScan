"""
File serving API routes
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Base upload directory
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))


@router.get("/{file_type}/{file_name}")
async def get_file(file_type: str, file_name: str):
    """Serve a file from the uploads directory"""
    try:
        file_path = UPLOAD_DIR / file_type / file_name
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        if not file_path.is_file():
            raise HTTPException(status_code=404, detail="Not a file")
        
        return FileResponse(
            path=file_path,
            filename=file_name,
            media_type="application/octet-stream"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving file: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve file")
