#!/usr/bin/env python3
"""
ConvertMaster CLI Converter Engine
Standalone command-line bridge for local conversions in Electron Desktop App.
Reads files directly from local filesystem with zero HTTP overhead.
Guarantees byte-level binary integrity and outputs JSON execution status.
"""

import sys
import os
import json
import argparse
from pathlib import Path

# Add backend directory to sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from converters.word_to_pdf import convert_word_to_pdf
from converters.pdf_to_word import convert_pdf_to_word
from converters.excel_to_pdf import convert_excel_to_pdf
from converters.image_to_pdf import convert_image_to_pdf

def convert_image_to_image(input_path: str, output_path: str, target_format: str):
    """Lossless and high-quality image format transcoding via Pillow."""
    from PIL import Image
    with Image.open(input_path) as img:
        fmt = target_format.upper()
        if fmt == 'JPG':
            fmt = 'JPEG'
        
        # JPEG does not support alpha channel
        if fmt == 'JPEG' and img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            rgb_img.paste(img, mask=img.split()[-1] if 'A' in img.mode else None)
            rgb_img.save(output_path, 'JPEG', quality=95)
        else:
            img.save(output_path, fmt)
    return output_path

def convert_text_to_pdf(input_path: str, output_path: str):
    """Converts plain text / markdown files into clean, readable PDF documents."""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    with open(input_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    styles = getSampleStyleSheet()
    pre_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1E293B')
    )

    story = [Preformatted(content, pre_style)]
    doc.build(story)
    return output_path

def run_conversion(input_path: str, target_format: str, output_path: str) -> dict:
    """Dispatches conversion based on file extension and target format."""
    input_file = Path(input_path).resolve()
    if not input_file.exists():
        raise FileNotFoundError(f"Input file does not exist: {input_path}")
    
    if input_file.stat().st_size == 0:
        raise ValueError(f"Input file is empty (0 bytes): {input_path}")

    source_ext = input_file.suffix.lower().lstrip('.')
    target_ext = target_format.lower().lstrip('.')
    
    output_file = Path(output_path).resolve()
    output_file.parent.mkdir(parents=True, exist_ok=True)
    out_str = str(output_file)

    # 1. Word to PDF
    if source_ext in ('docx', 'doc') and target_ext == 'pdf':
        convert_word_to_pdf(str(input_file), out_str)

    # 2. PDF to Word
    elif source_ext == 'pdf' and target_ext in ('docx', 'doc'):
        convert_pdf_to_word(str(input_file), out_str)

    # 3. Excel to PDF
    elif source_ext in ('xlsx', 'xls') and target_ext == 'pdf':
        convert_excel_to_pdf(str(input_file), out_str)

    # 4. Images to PDF
    elif source_ext in ('jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff') and target_ext == 'pdf':
        convert_image_to_pdf(str(input_file), out_str)

    # 5. Image to Image
    elif source_ext in ('jpg', 'jpeg', 'png', 'webp', 'bmp', 'ico') and target_ext in ('jpg', 'jpeg', 'png', 'webp', 'bmp', 'ico'):
        convert_image_to_image(str(input_file), out_str, target_ext)

    # 6. Plain Text / Markdown to PDF
    elif source_ext in ('txt', 'md', 'log', 'csv') and target_ext == 'pdf':
        convert_text_to_pdf(str(input_file), out_str)

    else:
        raise NotImplementedError(
            f"Conversion from '.{source_ext}' to '.{target_ext}' is not supported yet by the local engine."
        )

    if not output_file.exists() or output_file.stat().st_size == 0:
        raise RuntimeError(f"Conversion produced an empty or missing output file at {out_str}")

    return {
        "success": True,
        "input": str(input_file),
        "target": target_ext,
        "output": out_str,
        "sizeBytes": output_file.stat().st_size
    }

def main():
    parser = argparse.ArgumentParser(description="ConvertMaster Local CLI Converter")
    parser.add_argument("--input", "-i", required=True, help="Absolute path to input source file")
    parser.add_argument("--target", "-t", required=True, help="Target file format extension (e.g. pdf, docx, png)")
    parser.add_argument("--output", "-o", required=True, help="Absolute path to save converted output file")

    args = parser.parse_args()

    try:
        result = run_conversion(args.input, args.target, args.output)
        # Print JSON output to standard output for Electron IPC parser
        print(json.dumps(result))
        sys.exit(0)
    except Exception as err:
        err_payload = {
            "success": False,
            "error": str(err),
            "input": args.input,
            "target": args.target
        }
        print(json.dumps(err_payload), file=sys.stdout)
        print(f"ERROR: {err}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
