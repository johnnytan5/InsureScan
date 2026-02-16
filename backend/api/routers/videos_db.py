"""
Videos API routes - Manage video records linked to claims
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import logging

from lib.database import execute_query, execute_insert_returning

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
        query = "SELECT * FROM videos WHERE claim_id = %s ORDER BY id"
        videos = await execute_query(query, (claim_id,))
        return videos
    except Exception as e:
        logger.error(f"Error fetching videos: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch videos")


@router.post("/", status_code=201)
async def create_video(video: VideoCreate):
    """Create a new video record"""
    try:
        query = """
            INSERT INTO videos (claim_id, file_url, model_status) 
            VALUES (%s, %s, %s) 
            RETURNING *
        """
        new_video = await execute_insert_returning(
            query, 
            (video.claim_id, video.file_url, video.model_status)
        )
        return new_video
    except Exception as e:
        logger.error(f"Error creating video record: {e}")
        raise HTTPException(status_code=500, detail="Failed to create video record")
