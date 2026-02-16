"""
File upload API routes
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
import aiofiles
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Base upload directory
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form("documents"),
    fileName: str = Form(None)
):
    """Upload a file to the specified type directory"""
    try:
        # Create type directory if it doesn't exist
        type_dir = UPLOAD_DIR / type
        type_dir.mkdir(parents=True, exist_ok=True)
        
        # Use provided filename or original filename
        file_name = fileName or file.filename
        file_path = type_dir / file_name
        
        # Check file size (10MB limit)
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Generate file URL
        base_url = os.getenv("BASE_URL", "http://localhost:8000")
        file_url = f"{base_url}/api/files/{type}/{file_name}"
        
        return {
            "message": "File uploaded successfully",
            "fileName": file_name,
            "fileUrl": file_url,
            "type": type,
            "size": len(content)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")
