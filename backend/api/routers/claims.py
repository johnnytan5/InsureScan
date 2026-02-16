"""
Claims API routes - CRUD operations for insurance claims
"""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from lib.database_supabase import create_claim as db_create_claim
from lib.database_supabase import delete_claim as db_delete_claim
from lib.database_supabase import get_all_claims, get_claim_by_id
from lib.database_supabase import update_claim as db_update_claim
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class ClaimCreate(BaseModel):
    name: str
    status: str


class ClaimUpdate(BaseModel):
    status: Optional[str] = None
    claim_score: Optional[float] = None
    processed_at: Optional[str] = None


@router.get("/")
async def get_claims(status: Optional[str] = Query(None)):
    """Get all claims with optional status filter"""
    try:
        claims = await get_all_claims(status)
        return claims
    except Exception as e:
        logger.error(f"Error fetching claims: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch claims")


@router.post("/", status_code=201)
async def create_claim(claim: ClaimCreate):
    """Create a new claim"""
    try:
        new_claim = await db_create_claim(claim.name, claim.status)
        return new_claim
    except Exception as e:
        logger.error(f"Error creating claim: {e}")
        raise HTTPException(status_code=500, detail="Failed to create claim")


@router.get("/{claim_id}")
async def get_claim(claim_id: int):
    """Get a specific claim by ID"""
    try:
        claim = await get_claim_by_id(claim_id)
        
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        return claim
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching claim: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch claim")


@router.patch("/{claim_id}")
async def update_claim(claim_id: int, updates: ClaimUpdate):
    """Update a claim by ID"""
    try:
        # Build update dictionary from provided fields
        update_data = {}
        
        if updates.status is not None:
            update_data["status"] = updates.status
        
        if updates.claim_score is not None:
            update_data["claim_score"] = updates.claim_score
        
        if updates.processed_at is not None:
            update_data["processed_at"] = updates.processed_at
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        updated_claim = await db_update_claim(claim_id, update_data)
        return updated_claim
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating claim: {e}")
        raise HTTPException(status_code=500, detail="Failed to update claim")


@router.delete("/{claim_id}")
async def delete_claim_endpoint(claim_id: int):
    """Delete a claim by ID"""
    try:
        # Check if claim exists first
        claim = await get_claim_by_id(claim_id)
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        # Delete the claim
        success = await db_delete_claim(claim_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        return {"message": "Claim deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting claim: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete claim")
