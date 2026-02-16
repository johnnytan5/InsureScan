"""
Videos API routes - Manage video records linked to claims
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import logging

from lib.database_supabase import get_videos_by_claim, create_video as db_create_video

logger = logging.getLogger(__name__)
router = APIRouter()


class VideoCreate(BaseModel):
    claim_id: int
    file_url: str
    model_status: Optional[str] = None


@router.get("/")
async def get_videos(claim_id: int = Query(...)):
    """Get videos by claim_id"""
    try:
        videos = await get_videos_by_claim(claim_id)
        return videos
    except Exception as e:
        logger.error(f"Error fetching videos: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch videos")


@router.post("/", status_code=201)
async def create_video(video: VideoCreate):
    """Create a new video record"""
    try:
        new_video = await db_create_video(
            video.claim_id, 
            video.file_url, 
            video.model_status
        )
        return new_video
    except Exception as e:
        logger.error(f"Error creating video record: {e}")
        raise HTTPException(status_code=500, detail="Failed to create video record")
