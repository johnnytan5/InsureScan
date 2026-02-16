"""Damage detection router using ML models"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

from services.ml_inference.damage_detector import DamageDetector

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize damage detector
damage_detector = DamageDetector()


class DamageDetectionResult(BaseModel):
    """Damage detection result model"""
    detected: bool
    confidence: float
    damage_type: Optional[str] = None
    severity: Optional[str] = None
    bounding_boxes: List[dict] = []
    description: str


class BatchDetectionResult(BaseModel):
    """Batch detection result"""
    results: List[DamageDetectionResult]
    total_images: int
    damages_detected: int


@router.post("/detect-damage", response_model=DamageDetectionResult)
async def detect_damage(file: UploadFile = File(...)):
    """
    Detect damage in an uploaded image using ML model
    
    Args:
        file: Image file (JPEG, PNG)
        
    Returns:
        Damage detection result with confidence scores
    """
    try:
        logger.info(f"Processing damage detection for file: {file.filename}")
        
        # Read image file
        image_bytes = await file.read()
        
        # Perform damage detection
        result = await damage_detector.detect(image_bytes)
        
        logger.info(f"Detection complete: {result['detected']} (confidence: {result['confidence']})")
        return result
        
    except Exception as e:
        logger.error(f"Error in damage detection: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Damage detection failed: {str(e)}")


@router.post("/detect-damage-batch", response_model=BatchDetectionResult)
async def detect_damage_batch(files: List[UploadFile] = File(...)):
    """
    Detect damage in multiple images
    
    Args:
        files: List of image files
        
    Returns:
        Batch detection results
    """
    try:
        results = []
        damages_detected = 0
        
        for file in files:
            image_bytes = await file.read()
            result = await damage_detector.detect(image_bytes)
            results.append(result)
            
            if result["detected"]:
                damages_detected += 1
        
        return {
            "results": results,
            "total_images": len(files),
            "damages_detected": damages_detected
        }
        
    except Exception as e:
        logger.error(f"Error in batch damage detection: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch detection failed: {str(e)}")


@router.post("/assess-severity")
async def assess_damage_severity(file: UploadFile = File(...)):
    """
    Assess the severity of detected damage
    
    Args:
        file: Image file with visible damage
        
    Returns:
        Severity assessment (minor, moderate, severe, total_loss)
    """
    try:
        image_bytes = await file.read()
        severity_result = await damage_detector.assess_severity(image_bytes)
        
        return severity_result
        
    except Exception as e:
        logger.error(f"Error in severity assessment: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Severity assessment failed: {str(e)}")