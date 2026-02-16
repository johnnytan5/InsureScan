"""
LLM Query API routes - Query language model
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


class LLMQuery(BaseModel):
    input: str


@router.post("/")
async def query_llm(query: LLMQuery):
    """Query the LLM with user input"""
    try:
        if not openai_client:
            raise HTTPException(
                status_code=500,
                detail="LLM service not configured. Please set DASHSCOPE_API_KEY environment variable."
            )
        
        if not query.input:
            raise HTTPException(status_code=400, detail="Missing input in request body")
        
        completion = openai_client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant, please strictly adhere to the format."
                },
                {
                    "role": "user",
                    "content": query.input
                }
            ]
        )
        
        output = completion.choices[0].message.content
        
        return {"result": output}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LLM query error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "help": "https://www.alibabacloud.com/help/en/model-studio/developer-reference/error-code"
            }
        )
