"""
Database utilities using Supabase Python Client
"""
import os
from supabase import create_client, Client
from typing import Optional, List, Dict, Any
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Supabase configuration from environment
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
if not SUPABASE_URL:
    SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")

SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")
if not SUPABASE_KEY:
    SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY", "")

# Initialize Supabase client
supabase: Optional[Client] = None


def get_supabase_client() -> Client:
    """Get or create Supabase client instance"""
    global supabase
    if supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase


# Helper functions for common database operations

async def get_all_claims(status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all claims, optionally filtered by status"""
    client = get_supabase_client()
    query = client.table("claims").select("*").order("created_at", desc=True)
    
    if status:
        query = query.eq("status", status)
    
    response = query.execute()
    return response.data


async def get_claim_by_id(claim_id: int) -> Optional[Dict[str, Any]]:
    """Get a single claim by ID"""
    client = get_supabase_client()
    response = client.table("claims").select("*").eq("id", claim_id).execute()
    return response.data[0] if response.data else None


async def create_claim(name: str, status: str) -> Dict[str, Any]:
    """Create a new claim"""
    client = get_supabase_client()
    response = client.table("claims").insert({
        "name": name,
        "status": status
    }).execute()
    return response.data[0]


async def update_claim(claim_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update a claim by ID"""
    client = get_supabase_client()
    response = client.table("claims").update(updates).eq("id", claim_id).execute()
    if not response.data:
        raise ValueError(f"Claim {claim_id} not found")
    return response.data[0]


async def delete_claim(claim_id: int) -> bool:
    """Delete a claim by ID"""
    client = get_supabase_client()
    response = client.table("claims").delete().eq("id", claim_id).execute()
    return len(response.data) > 0


async def get_documents_by_claim(claim_id: int) -> List[Dict[str, Any]]:
    """Get all documents for a claim"""
    client = get_supabase_client()
    response = client.table("documents").select("*").eq("claim_id", claim_id).order("id").execute()
    return response.data


async def create_document(claim_id: int, doc_type: str, file_url: str) -> Dict[str, Any]:
    """Create a new document"""
    client = get_supabase_client()
    response = client.table("documents").insert({
        "claim_id": claim_id,
        "doc_type": doc_type,
        "file_url": file_url
    }).execute()
    return response.data[0]


async def get_images_by_claim(claim_id: int) -> List[Dict[str, Any]]:
    """Get all images for a claim"""
    client = get_supabase_client()
    response = client.table("images").select("*").eq("claim_id", claim_id).order("id").execute()
    return response.data


async def create_image(claim_id: int, file_url: str, part: Optional[str] = None, severity: Optional[str] = None) -> Dict[str, Any]:
    """Create a new image record"""
    client = get_supabase_client()
    response = client.table("images").insert({
        "claim_id": claim_id,
        "file_url": file_url,
        "part": part,
        "severity": severity
    }).execute()
    return response.data[0]


async def get_videos_by_claim(claim_id: int) -> List[Dict[str, Any]]:
    """Get all videos for a claim"""
    client = get_supabase_client()
    response = client.table("videos").select("*").eq("claim_id", claim_id).order("id").execute()
    return response.data


async def create_video(claim_id: int, file_url: str, model_status: Optional[str] = None) -> Dict[str, Any]:
    """Create a new video record"""
    client = get_supabase_client()
    response = client.table("videos").insert({
        "claim_id": claim_id,
        "file_url": file_url,
        "model_status": model_status
    }).execute()
    return response.data[0]
