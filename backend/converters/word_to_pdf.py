"""
Word (DOCX) to PDF Conversion Module
Implements a 3-tier conversion strategy for maximum reliability:
1. Primary: docx2pdf (Native Microsoft Word engine on Windows for pixel-perfect fidelity)
2. Secondary: LibreOffice / soffice CLI (Headless document engine)
3. Fallback: Pure-Python python-docx + ReportLab generator (Guaranteed zero external dependency fallback)
"""

import os
import shutil
import subprocess
from typing import Optional
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

def convert_word_to_pdf(input_docx_path: str, output_pdf_path: str) -> str:
    """
    Convert a Word (.docx) document to a PDF file.

    :param input_docx_path: Absolute path to the .docx file
    :param output_pdf_path: Absolute path to the output .pdf file
    :return: output_pdf_path
    """
    if not os.path.exists(input_docx_path):
        raise FileNotFoundError(f"Source Word file not found: {input_docx_path}")

    if os.path.getsize(input_docx_path) == 0:
        raise ValueError("Source Word file is empty (0 bytes).")

    # Tier 1: Try docx2pdf (best for Windows with Microsoft Word installed)
    try:
        from docx2pdf import convert
        # docx2pdf accepts file paths or directory
        convert(input_docx_path, output_pdf_path)
        if os.path.exists(output_pdf_path) and os.path.getsize(output_pdf_path) > 0:
            return output_pdf_path
    except Exception as e:
        # docx2pdf failed (e.g. Word not installed, COM error, or headless server)
        pass

    # Tier 2: Try LibreOffice soffice if installed
    soffice_path = shutil.which("soffice") or shutil.which("libreoffice")
    if not soffice_path and os.name == "nt":
        # Check standard Windows paths
        candidates = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe"
        ]
        for c in candidates:
            if os.path.exists(c):
                soffice_path = c
                break

    if soffice_path:
        try:
            out_dir = os.path.dirname(output_pdf_path)
            cmd = [soffice_path, "--headless", "--convert-to", "pdf", "--outdir", out_dir, input_docx_path]
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=45)
            
            # LibreOffice writes with same base name in out_dir
            base_name = os.path.splitext(os.path.basename(input_docx_path))[0]
            libre_out = os.path.join(out_dir, f"{base_name}.pdf")
            if os.path.exists(libre_out):
                if libre_out != output_pdf_path:
                    shutil.move(libre_out, output_pdf_path)
                if os.path.getsize(output_pdf_path) > 0:
                    return output_pdf_path
        except Exception:
            pass

    # Tier 3: Pure-Python Fallback (python-docx + ReportLab)
    # Guaranteed to work in pure Python without MS Word or LibreOffice
    _pure_python_docx_to_pdf(input_docx_path, output_pdf_path)
    
    if not os.path.exists(output_pdf_path) or os.path.getsize(output_pdf_path) == 0:
        raise RuntimeError("Word to PDF conversion failed across all conversion backends.")

    return output_pdf_path


def _pure_python_docx_to_pdf(input_docx_path: str, output_pdf_path: str):
    """
    Parses paragraphs, headings, bullet points, and tables from .docx
    and constructs a valid binary PDF with ReportLab.
    """
    doc = Document(input_docx_path)
    pdf = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    story = []

    # Custom styles
    title_style = ParagraphStyle(
        'DocxTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=12
    )
    heading2_style = ParagraphStyle(
        'DocxH2',
        parent=styles['Heading2'],
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#334155'),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'DocxBody',
        parent=styles['Normal'],
        fontSize=10.5,
        leading=14.5,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=6
    )

    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            story.append(Spacer(1, 6))
            continue

        # Format XML tags for ReportLab
        safe_text = (
            text.replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
        )

        style_name = p.style.name.lower()
        if 'heading 1' in style_name or 'title' in style_name:
            story.append(Paragraph(safe_text, title_style))
        elif 'heading 2' in style_name or 'heading 3' in style_name:
            story.append(Paragraph(safe_text, heading2_style))
        else:
            story.append(Paragraph(safe_text, body_style))

    # Process tables if present
    for table in doc.tables:
        table_data = []
        for row in table.rows:
            row_data = []
            for cell in row.cells:
                cell_text = cell.text.strip().replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                row_data.append(Paragraph(cell_text, body_style))
            table_data.append(row_data)

        if table_data:
            reportlab_table = Table(table_data)
            reportlab_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ]))
            story.append(Spacer(1, 10))
            story.append(reportlab_table)
            story.append(Spacer(1, 10))

    if not story:
        story.append(Paragraph("Empty Document", body_style))

    pdf.build(story)
