"""
Documents API routes - Manage document records linked to claims
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import logging

from lib.database import execute_query, execute_insert_returning

logger = logging.getLogger(__name__)
router = APIRouter()


class DocumentCreate(BaseModel):
    claim_id: int
    doc_type: str
    file_url: str


@router.get("/")
async def get_documents(claim_id: int = Query(...)):
    """Get documents by claim_id"""
    try:
        query = "SELECT * FROM documents WHERE claim_id = %s ORDER BY id"
        documents = await execute_query(query, (claim_id,))
        return documents
    except Exception as e:
        logger.error(f"Error fetching documents: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch documents")


@router.post("/", status_code=201)
async def create_document(document: DocumentCreate):
    """Create a new document record"""
    try:
        query = """
            INSERT INTO documents (claim_id, doc_type, file_url) 
            VALUES (%s, %s, %s) 
            RETURNING *
        """
        new_doc = await execute_insert_returning(
            query, 
            (document.claim_id, document.doc_type, document.file_url)
        )
        return new_doc
    except Exception as e:
        logger.error(f"Error creating document: {e}")
        raise HTTPException(status_code=500, detail="Failed to create document")
