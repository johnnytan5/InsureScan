"""Image processing service"""

import io
import logging
from typing import Dict, Any
from PIL import Image, ImageEnhance, ImageStat
import base64
import hashlib

logger = logging.getLogger(__name__)


class ImageProcessor:
    """Image processing and enhancement"""
    
    def __init__(self):
        logger.info("Image processor initialized")
    
    async def enhance(
        self,
        image_bytes: bytes,
        brightness: float = 1.0,
        contrast: float = 1.0,
        sharpness: float = 1.0
    ) -> str:
        """
        Enhance image quality
        
        Args:
            image_bytes: Image data
            brightness: Brightness multiplier
            contrast: Contrast multiplier
            sharpness: Sharpness multiplier
            
        Returns:
            Base64 encoded enhanced image
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            # Apply enhancements
            if brightness != 1.0:
                enhancer = ImageEnhance.Brightness(image)
                image = enhancer.enhance(brightness)
            
            if contrast != 1.0:
                enhancer = ImageEnhance.Contrast(image)
                image = enhancer.enhance(contrast)
            
            if sharpness != 1.0:
                enhancer = ImageEnhance.Sharpness(image)
                image = enhancer.enhance(sharpness)
            
            # Convert to base64
            buffer = io.BytesIO()
            image.save(buffer, format='PNG')
            enhanced_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return f"data:image/png;base64,{enhanced_base64}"
            
        except Exception as e:
            logger.error(f"Error enhancing image: {e}", exc_info=True)
            raise
    
    async def extract_metadata(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extract EXIF and metadata from image
        
        Args:
            image_bytes: Image data
            
        Returns:
            Metadata dictionary
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            # Basic metadata
            metadata = {
                "format": image.format,
                "mode": image.mode,
                "size": {"width": image.width, "height": image.height},
                "file_size_bytes": len(image_bytes)
            }
            
            # EXIF data
            exif_data = image.getexif()
            if exif_data:
                metadata["exif"] = {
                    str(tag): str(value)
                    for tag, value in exif_data.items()
                }
            
            # Image statistics
            stat = ImageStat.Stat(image)
            metadata["statistics"] = {
                "mean": stat.mean,
                "median": stat.median,
                "stddev": stat.stddev
            }
            
            # Generate hash for duplicate detection
            metadata["hash"] = hashlib.sha256(image_bytes).hexdigest()
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error extracting metadata: {e}", exc_info=True)
            raise
    
    async def compare(self, image1_bytes: bytes, image2_bytes: bytes) -> Dict[str, Any]:
        """
        Compare two images and calculate similarity
        
        Args:
            image1_bytes: First image
            image2_bytes: Second image
            
        Returns:
            Comparison result with similarity score
        """
        try:
            img1 = Image.open(io.BytesIO(image1_bytes)).convert('RGB')
            img2 = Image.open(io.BytesIO(image2_bytes)).convert('RGB')
            
            # Resize to same size for comparison
            size = (256, 256)
            img1 = img1.resize(size)
            img2 = img2.resize(size)
            
            # Calculate pixel-wise difference
            import numpy as np
            arr1 = np.array(img1)
            arr2 = np.array(img2)
            
            # Mean squared error
            mse = np.mean((arr1 - arr2) ** 2)
            
            # Normalized similarity score (0-1, where 1 is identical)
            max_mse = 255 ** 2
            similarity = 1 - (mse / max_mse)
            
            return {
                "similarity_score": float(similarity),
                "mse": float(mse),
                "identical": similarity > 0.99,
                "similar": similarity > 0.85,
                "interpretation": self._interpret_similarity(similarity)
            }
            
        except Exception as e:
            logger.error(f"Error comparing images: {e}", exc_info=True)
            raise
    
    def _interpret_similarity(self, score: float) -> str:
        """Interpret similarity score"""
        if score > 0.99:
            return "Images are identical or nearly identical"
        elif score > 0.85:
            return "Images are very similar"
        elif score > 0.70:
            return "Images have significant similarities"
        elif score > 0.50:
            return "Images have some similarities"
        else:
            return "Images are quite different"