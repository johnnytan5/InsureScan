"""Application configuration"""

from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    API_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    
    # LLM Configuration
    DASHSCOPE_API_KEY: str = ""
    BASE_URL: str = "http://localhost:8000"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
    
    # Node.js Backend Integration
    NODEJS_BACKEND_URL: str = "http://localhost:3001"
    
    # File Storage
    UPLOAD_DIR: str = "../uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # ML Model Configuration
    MODEL_DIR: str = "./models"
    DEVICE: str = "cpu"  # or "cuda" if GPU available
    
    # Image Processing
    MAX_IMAGE_SIZE: int = 4096
    SUPPORTED_IMAGE_FORMATS: List[str] = [".jpg", ".jpeg", ".png", ".bmp", ".tiff"]
    
    # Video Processing
    MAX_VIDEO_DURATION: int = 300  # 5 minutes
    VIDEO_FRAME_RATE: int = 1  # Process 1 frame per second
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields like NEXT_PUBLIC_...

    def model_post_init(self, __context):
        """Fallback to NEXT_PUBLIC variables if SUPABASE vars are empty"""
        if not self.SUPABASE_URL:
            import os
            self.SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
        if not self.SUPABASE_ANON_KEY:
            import os
            self.SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY", "")


settings = Settings()