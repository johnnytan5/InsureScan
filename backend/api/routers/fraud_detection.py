"""Fraud detection router"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import logging

from services.fraud_detection.detector import FraudDetector

logger = logging.getLogger(__name__)
router = APIRouter()

fraud_detector = FraudDetector()


class ClaimData(BaseModel):
    """Claim data for fraud detection"""
    claim_id: str
    claim_amount: float
    claim_type: str
    claimant_history: Dict[str, Any]
    images: List[str] = []
    documents: List[str] = []
    metadata: Dict[str, Any] = {}


class FraudScore(BaseModel):
    """Fraud detection score"""
    claim_id: str
    fraud_probability: float
    risk_level: str
    flags: List[str]
    confidence: float
    explanation: str


@router.post("/analyze-claim", response_model=FraudScore)
async def analyze_claim(claim: ClaimData):
    """
    Analyze a claim for potential fraud indicators
    
    Uses ML model to detect anomalies and suspicious patterns
    """
    try:
        logger.info(f"Analyzing claim {claim.claim_id} for fraud")
        
        result = await fraud_detector.analyze(claim.dict())
        
        return result
        
    except Exception as e:
        logger.error(f"Error in fraud detection: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-duplicate")
async def check_duplicate_claim(claim: ClaimData):
    """
    Check if claim is potentially a duplicate or related to previous fraudulent claims
    """
    try:
        result = await fraud_detector.check_duplicate(claim.dict())
        
        return result
        
    except Exception as e:
        logger.error(f"Error checking duplicates: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-pattern")
async def analyze_pattern(claims: List[ClaimData]):
    """
    Analyze patterns across multiple claims to detect organized fraud
    """
    try:
        claims_data = [claim.dict() for claim in claims]
        result = await fraud_detector.analyze_pattern(claims_data)
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing patterns: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))