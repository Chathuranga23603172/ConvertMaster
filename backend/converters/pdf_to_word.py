"""
PDF to Word (DOCX) Conversion Module
Uses pdf2docx for layout analysis, table extraction, and typography preservation.
"""

import os
from pdf2docx import Converter

def convert_pdf_to_word(input_pdf_path: str, output_docx_path: str, start_page: int = 0, end_page: int = None) -> str:
    """
    Convert a PDF file to editable Word document (.docx).

    :param input_pdf_path: Path to the source PDF file
    :param output_docx_path: Destination path for the .docx file
    :param start_page: First page index (0-based)
    :param end_page: Last page index (None converts all pages)
    :return: output_docx_path
    """
    if not os.path.exists(input_pdf_path):
        raise FileNotFoundError(f"PDF file not found: {input_pdf_path}")

    if os.path.getsize(input_pdf_path) == 0:
        raise ValueError("Source PDF file is empty (0 bytes).")

    cv = None
    try:
        cv = Converter(input_pdf_path)
        # Convert pages (start=0, end=None translates to all pages)
        cv.convert(output_docx_path, start=start_page, end=end_page)
    finally:
        if cv is not None:
            cv.close()

    if not os.path.exists(output_docx_path) or os.path.getsize(output_docx_path) == 0:
        raise RuntimeError("Failed to generate Word document (.docx) or output file is empty.")

    return output_docx_path
