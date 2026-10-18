"""
Image to PDF Conversion Module
Supports PNG, JPG, JPEG, WEBP, BMP, TIFF, GIF to PDF.
Handles alpha transparency by flattening onto a crisp white background.
Supports single image and multi-image conversions.
"""

import os
from PIL import Image
from typing import List, Union

def convert_image_to_pdf(input_paths: Union[str, List[str]], output_path: str) -> str:
    """
    Convert one or more images into a single valid, uncorrupted PDF.
    
    :param input_paths: Single file path or list of file paths
    :param output_path: Destination path for the generated PDF
    :return: output_path
    """
    if isinstance(input_paths, str):
        input_paths = [input_paths]

    if not input_paths:
        raise ValueError("At least one image file is required.")

    processed_images = []
    
    for path in input_paths:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Image file not found: {path}")

        img = Image.open(path)
        
        # Convert RGBA/LA/P images with transparency to RGB on white background
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            img = img.convert("RGBA")
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3]) # 3 is the alpha channel
            processed_images.append(background)
        else:
            processed_images.append(img.convert("RGB"))

    # Save as PDF in binary mode
    primary_image = processed_images[0]
    additional_images = processed_images[1:] if len(processed_images) > 1 else []

    primary_image.save(
        output_path,
        "PDF",
        resolution=100.0,
        save_all=bool(additional_images),
        append_images=additional_images
    )

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        raise RuntimeError("Generated PDF is missing or zero bytes.")

    return output_path
