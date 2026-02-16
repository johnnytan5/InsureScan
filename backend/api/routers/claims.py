"""
Claims API routes - CRUD operations for insurance claims
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import logging

from lib.database import execute_query, execute_query_one, execute_insert_returning, execute_update

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
        if status:
            query = "SELECT * FROM claims WHERE status = %s ORDER BY created_at DESC"
            claims = await execute_query(query, (status,))
        else:
            query = "SELECT * FROM claims ORDER BY created_at DESC"
            claims = await execute_query(query)
        
        return claims
    except Exception as e:
        logger.error(f"Error fetching claims: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch claims")


@router.post("/", status_code=201)
async def create_claim(claim: ClaimCreate):
    """Create a new claim"""
    try:
        query = """
            INSERT INTO claims (name, status, created_at) 
            VALUES (%s, %s, NOW()) 
            RETURNING *
        """
        new_claim = await execute_insert_returning(query, (claim.name, claim.status))
        return new_claim
    except Exception as e:
        logger.error(f"Error creating claim: {e}")
        raise HTTPException(status_code=500, detail="Failed to create claim")


@router.get("/{claim_id}")
async def get_claim(claim_id: int):
    """Get a specific claim by ID"""
    try:
        query = "SELECT * FROM claims WHERE id = %s"
        claim = await execute_query_one(query, (claim_id,))
        
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
        # Build dynamic UPDATE query
        update_fields = []
        params = []
        
        if updates.status is not None:
            update_fields.append("status = %s")
            params.append(updates.status)
        
        if updates.claim_score is not None:
            update_fields.append("claim_score = %s")
            params.append(updates.claim_score)
        
        if updates.processed_at is not None:
            update_fields.append("processed_at = %s")
            params.append(updates.processed_at)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        params.append(claim_id)
        query = f"""
            UPDATE claims 
            SET {', '.join(update_fields)} 
            WHERE id = %s
            RETURNING *
        """
        
        updated_claim = await execute_insert_returning(query, tuple(params))
        
        if not updated_claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        return updated_claim
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating claim: {e}")
        raise HTTPException(status_code=500, detail="Failed to update claim")


@router.delete("/{claim_id}")
async def delete_claim(claim_id: int):
    """Delete a claim by ID"""
    try:
        # First check if claim exists
        check_query = "SELECT id FROM claims WHERE id = %s"
        claim = await execute_query_one(check_query, (claim_id,))
        
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        # Delete the claim
        delete_query = "DELETE FROM claims WHERE id = %s"
        await execute_update(delete_query, (claim_id,))
        
        return {"message": "Claim deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting claim: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete claim")
