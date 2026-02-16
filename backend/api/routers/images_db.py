"""
Images API routes - Manage image records linked to claims
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import logging

from lib.database_supabase import get_images_by_claim, create_image as db_create_image

logger = logging.getLogger(__name__)
router = APIRouter()


class ImageCreate(BaseModel):
    claim_id: int
    file_url: str
    part: Optional[str] = None
    severity: Optional[str] = None


@router.get("/")
async def get_images(claim_id: int = Query(...)):
    """Get images by claim_id"""
    try:
        images = await get_images_by_claim(claim_id)
        return images
    except Exception as e:
        logger.error(f"Error fetching images: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch images")


@router.post("/", status_code=201)
async def create_image(image: ImageCreate):
    """Create a new image record"""
    try:
        new_image = await db_create_image(
            image.claim_id, 
            image.file_url, 
            image.part, 
            image.severity
        )
        return new_image
    except Exception as e:
        logger.error(f"Error creating image record: {e}")
        raise HTTPException(status_code=500, detail="Failed to create image record")
