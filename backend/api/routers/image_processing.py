"""Image processing router"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
import logging

from services.image_processing.processor import ImageProcessor

logger = logging.getLogger(__name__)
router = APIRouter()

image_processor = ImageProcessor()


@router.post("/enhance")
async def enhance_image(
    file: UploadFile = File(...),
    brightness: Optional[float] = 1.0,
    contrast: Optional[float] = 1.0,
    sharpness: Optional[float] = 1.0
):
    """
    Enhance image quality for better analysis
    
    Args:
        file: Image file
        brightness: Brightness adjustment (0.5-2.0)
        contrast: Contrast adjustment (0.5-2.0)
        sharpness: Sharpness adjustment (0.5-2.0)
    """
    try:
        image_bytes = await file.read()
        
        enhanced = await image_processor.enhance(
            image_bytes,
            brightness=brightness,
            contrast=contrast,
            sharpness=sharpness
        )
        
        return {"enhanced_image": enhanced, "status": "success"}
        
    except Exception as e:
        logger.error(f"Error enhancing image: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-metadata")
async def extract_metadata(file: UploadFile = File(...)):
    """Extract EXIF and metadata from image"""
    try:
        image_bytes = await file.read()
        metadata = await image_processor.extract_metadata(image_bytes)
        
        return metadata
        
    except Exception as e:
        logger.error(f"Error extracting metadata: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare")
async def compare_images(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...)
):
    """
    Compare two images and calculate similarity score
    
    Useful for comparing before/after damage photos
    """
    try:
        image1_bytes = await file1.read()
        image2_bytes = await file2.read()
        
        comparison = await image_processor.compare(image1_bytes, image2_bytes)
        
        return comparison
        
    except Exception as e:
        logger.error(f"Error comparing images: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))