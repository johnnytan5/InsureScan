"""
OCR API routes - Optical Character Recognition using Vision LLM
"""
import logging
import os

from fastapi import APIRouter, HTTPException
from openai import OpenAI
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize OpenAI client (will be None if API key not set)
openai_client = None
if os.getenv("DASHSCOPE_API_KEY"):
    openai_client = OpenAI(
        api_key=os.getenv("DASHSCOPE_API_KEY"),
        base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
    )


class OCRRequest(BaseModel):
    imageBase64: str


@router.post("/")
async def perform_ocr(request: OCRRequest):
    """Perform OCR on an image using Vision LLM"""
    try:
        if not openai_client:
            raise HTTPException(
                status_code=500,
                detail="OCR service not configured. Please set DASHSCOPE_API_KEY environment variable."
            )
        
        if not request.imageBase64 or not request.imageBase64.startswith('data:image/'):
            raise HTTPException(status_code=400, detail="Valid image base64 is required")
        
        response = openai_client.chat.completions.create(
            model="qwen-vl-max",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that extracts text from images."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": request.imageBase64}
                        },
                        {
                            "type": "text",
                            "text": "Extract all text and return them in a clean format. Focus on extracting all readable text including any document information, forms, or structured data."
                        }
                    ]
                }
            ]
        )
        
        extracted_text = response.choices[0].message.content or ""
        
        return {
            "success": True,
            "extractedText": extracted_text,
            "usage": response.usage.model_dump() if response.usage else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": str(e), "success": False}
        )


@router.post("/test")
async def test_ocr(request: OCRRequest):
    """Test OCR functionality with specific instructions"""
    try:
        if not openai_client:
            raise HTTPException(
                status_code=500,
                detail="OCR service not configured. Please set DASHSCOPE_API_KEY environment variable."
            )
        
        if not request.imageBase64 or not request.imageBase64.startswith('data:image/'):
            raise HTTPException(status_code=400, detail="Valid image base64 is required")
        
        response = openai_client.chat.completions.create(
            model="qwen-vl-max",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that extracts information from documents."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": request.imageBase64}
                        },
                        {
                            "type": "text",
                            "text": "Extract all text and return them in a clean format please. Extract driver information, license details, and any other relevant document information."
                        }
                    ]
                }
            ]
        )
        
        extracted_text = response.choices[0].message.content or ""
        
        return {
            "extractedText": extracted_text,
            "model": "qwen-vl-max",
            "success": True
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR test error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": str(e), "success": False}
        )
