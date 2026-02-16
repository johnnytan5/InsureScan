"""Video analysis router"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
import logging

from services.video_analysis.analyzer import VideoAnalyzer

logger = logging.getLogger(__name__)
router = APIRouter()

video_analyzer = VideoAnalyzer()


class VideoAnalysisResult(BaseModel):
    """Video analysis result"""
    duration: float
    frame_count: int
    fps: float
    resolution: dict
    key_frames: List[dict]
    detected_objects: List[dict]
    summary: str


@router.post("/analyze", response_model=VideoAnalysisResult)
async def analyze_video(file: UploadFile = File(...)):
    """
    Analyze video for damage assessment
    
    Extracts key frames, detects objects, and analyzes motion
    """
    try:
        logger.info(f"Analyzing video: {file.filename}")
        
        video_bytes = await file.read()
        result = await video_analyzer.analyze(video_bytes)
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing video: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-frames")
async def extract_frames(
    file: UploadFile = File(...),
    interval: int = 1
):
    """
    Extract frames from video at specified interval
    
    Args:
        file: Video file
        interval: Extract one frame every N seconds
    """
    try:
        video_bytes = await file.read()
        frames = await video_analyzer.extract_frames(video_bytes, interval)
        
        return {
            "frame_count": len(frames),
            "frames": frames
        }
        
    except Exception as e:
        logger.error(f"Error extracting frames: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))