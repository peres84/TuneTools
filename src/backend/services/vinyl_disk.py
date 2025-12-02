"""
Vinyl Disk Service
Transforms album artwork into vinyl disk images with center hole
"""
from typing import Optional
from PIL import Image, ImageDraw
from io import BytesIO

from utils.custom_logger import log_handler


def create_vinyl_mask(size, hole_ratio=0.14):
    """
    Create a circular mask with a center hole (like a vinyl record).

    Args:
        size: Tuple of (width, height) for the mask
        hole_ratio: Ratio of the hole diameter to the outer diameter (default: 0.14 for vinyl)

    Returns:
        PIL Image object with the mask (grayscale)
    """
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)

    # Calculate dimensions
    width, height = size
    min_dim = min(width, height)

    # Outer circle (full disk)
    outer_radius = min_dim // 2
    center_x, center_y = width // 2, height // 2

    # Draw outer circle (white)
    draw.ellipse(
        [center_x - outer_radius, center_y - outer_radius,
         center_x + outer_radius, center_y + outer_radius],
        fill=255
    )

    # Inner hole (black - transparent)
    inner_radius = int(outer_radius * hole_ratio)
    draw.ellipse(
        [center_x - inner_radius, center_y - inner_radius,
         center_x + inner_radius, center_y + inner_radius],
        fill=0
    )

    return mask


class VinylDiskService:
    """
    Service for transforming album artwork into vinyl disk images
    
    Implements 14% hole ratio for authentic vinyl record appearance
    """
    
    def __init__(self):
        self.default_disk_size = 1000
        self.vinyl_hole_ratio = 0.14  # Standard vinyl record ratio
    
    def create_vinyl_disk(
        self,
        image_data: bytes,
        disk_size: Optional[int] = None,
        hole_ratio: Optional[float] = None
    ) -> bytes:
        """
        Transform album artwork into vinyl disk shape
        
        Args:
            image_data: Input image bytes (PNG/JPEG)
            disk_size: Output size in pixels (default: 1000)
            hole_ratio: Center hole ratio (default: 0.14)
            
        Returns:
            bytes: PNG image data of vinyl disk
        """
        disk_size = disk_size or self.default_disk_size
        hole_ratio = hole_ratio or self.vinyl_hole_ratio
        
        # Validate hole ratio
        if not 0 < hole_ratio < 0.5:
            log_handler.warning("Invalid hole ratio {hole_ratio}, using default 0.14")
            hole_ratio = 0.14
        
        log_handler.info(f"[MUSIC] Creating vinyl disk (size: {disk_size}px, hole: {hole_ratio:.1%})")
        
        # Load image
        img = Image.open(BytesIO(image_data))
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Resize/crop to square
        width, height = img.size
        min_dim = min(width, height)
        
        # Crop to center square
        left = (width - min_dim) // 2
        top = (height - min_dim) // 2
        right = left + min_dim
        bottom = top + min_dim
        img_square = img.crop((left, top, right, bottom))
        
        # Resize to target disk size
        img_resized = img_square.resize((disk_size, disk_size), Image.Resampling.LANCZOS)
        
        # Create the vinyl mask
        mask = create_vinyl_mask((disk_size, disk_size), hole_ratio)
        
        # Create output image with transparent background
        output = Image.new('RGBA', (disk_size, disk_size), (0, 0, 0, 0))
        
        # Apply mask to create vinyl disk effect
        output.paste(img_resized, (0, 0), mask)
        
        # Convert to bytes
        output_bytes = BytesIO()
        output.save(output_bytes, format='PNG')
        
        log_handler.info(f"[OK] Vinyl disk created ({disk_size}x{disk_size}px, {hole_ratio:.1%} hole)")
        
        return output_bytes.getvalue()
    
    def validate_hole_ratio(self, hole_ratio: float) -> bool:
        """
        Validate that hole ratio is correct (14% for vinyl)
        
        Args:
            hole_ratio: Hole ratio to validate
            
        Returns:
            bool: True if ratio is 0.14 (14%)
        """
        return abs(hole_ratio - 0.14) < 0.001
    
    def save_vinyl_disk(self, vinyl_data: bytes, output_path: str):
        """
        Save vinyl disk image to file
        
        Args:
            vinyl_data: PNG image bytes
            output_path: Path to save image
        """
        with open(output_path, 'wb') as f:
            f.write(vinyl_data)
        
        log_handler.info(f"[OK] Saved vinyl disk to {output_path}")
    
    def create_from_file(
        self,
        input_path: str,
        output_path: str,
        disk_size: Optional[int] = None,
        hole_ratio: Optional[float] = None
    ):
        """
        Create vinyl disk from image file
        
        Args:
            input_path: Path to input image
            output_path: Path to save output
            disk_size: Output size in pixels
            hole_ratio: Center hole ratio
        """
        # Read input file
        with open(input_path, 'rb') as f:
            image_data = f.read()
        
        # Create vinyl disk
        vinyl_data = self.create_vinyl_disk(image_data, disk_size, hole_ratio)
        
        # Save output
        self.save_vinyl_disk(vinyl_data, output_path)
