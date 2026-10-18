"""
Excel (XLSX / XLS) to PDF Conversion Module
Parses spreadsheet workbooks using openpyxl and generates high-fidelity tabular PDF documents
via ReportLab, or uses LibreOffice if installed.
"""

import os
import shutil
import subprocess
from openpyxl import load_workbook
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

def convert_excel_to_pdf(input_xlsx_path: str, output_pdf_path: str) -> str:
    """
    Convert an Excel spreadsheet (.xlsx, .xls) to a PDF document.

    :param input_xlsx_path: Absolute path to the spreadsheet file
    :param output_pdf_path: Absolute path to destination PDF
    :return: output_pdf_path
    """
    if not os.path.exists(input_xlsx_path):
        raise FileNotFoundError(f"Source Excel file not found: {input_xlsx_path}")

    if os.path.getsize(input_xlsx_path) == 0:
        raise ValueError("Source Excel file is empty (0 bytes).")

    # Tier 1: Try LibreOffice if available
    soffice_path = shutil.which("soffice") or shutil.which("libreoffice")
    if not soffice_path and os.name == "nt":
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
            cmd = [soffice_path, "--headless", "--convert-to", "pdf", "--outdir", out_dir, input_xlsx_path]
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=45)
            
            base_name = os.path.splitext(os.path.basename(input_xlsx_path))[0]
            libre_out = os.path.join(out_dir, f"{base_name}.pdf")
            if os.path.exists(libre_out):
                if libre_out != output_pdf_path:
                    shutil.move(libre_out, output_pdf_path)
                if os.path.getsize(output_pdf_path) > 0:
                    return output_pdf_path
        except Exception:
            pass

    # Tier 2: Pure-Python openpyxl + ReportLab Tabular Engine
    _pure_python_excel_to_pdf(input_xlsx_path, output_pdf_path)

    if not os.path.exists(output_pdf_path) or os.path.getsize(output_pdf_path) == 0:
        raise RuntimeError("Excel to PDF conversion failed.")

    return output_pdf_path


def _pure_python_excel_to_pdf(input_xlsx_path: str, output_pdf_path: str):
    """
    Parses sheets, rows, formulas, and cells from Excel workbook
    and renders a landscape tabular PDF with ReportLab.
    """
    # data_only=True evaluates and reads cached formula values
    wb = load_workbook(input_xlsx_path, data_only=True)
    sheet = wb.active

    # Use landscape letter to accommodate spreadsheet columns comfortably
    pdf = SimpleDocTemplate(
        output_pdf_path,
        pagesize=landscape(letter),
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    story = []

    # Title with sheet name
    title_style = ParagraphStyle(
        'SheetTitle',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=12
    )
    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1e293b')
    )
    header_cell_style = ParagraphStyle(
        'HeaderCellText',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#0f172a')
    )

    story.append(Paragraph(f"Spreadsheet: {sheet.title}", title_style))

    # Read rows
    table_data = []
    max_cols = 0

    for row_idx, row in enumerate(sheet.iter_rows(values_only=True)):
        if row_idx > 200: # Cap at 200 rows per sheet to prevent out-of-memory
            break
        # Filter trailing empty cells
        cleaned_row = []
        for cell_val in row:
            val_str = "" if cell_val is None else str(cell_val).strip()
            # Sanitize xml for reportlab paragraph
            val_str = val_str.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            if row_idx == 0:
                cleaned_row.append(Paragraph(val_str, header_cell_style))
            else:
                cleaned_row.append(Paragraph(val_str, cell_style))

        if any(cell_val is not None and str(cell_val).strip() != "" for cell_val in row):
            table_data.append(cleaned_row)
            if len(cleaned_row) > max_cols:
                max_cols = len(cleaned_row)

    if not table_data:
        story.append(Paragraph("Empty Spreadsheet", cell_style))
    else:
        # Pad shorter rows
        for r in table_data:
            while len(r) < max_cols:
                r.append(Paragraph("", cell_style))

        # Calculate balanced column widths across the page width (792 - 72 = 720 points)
        available_width = 720
        col_width = max(45, available_width / max(1, max_cols))
        col_widths = [col_width] * max_cols

        reportlab_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        reportlab_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            # Alternating row colors
            *[( 'BACKGROUND', (0, i), (-1, i), colors.HexColor('#f8fafc') ) for i in range(1, len(table_data), 2)]
        ]))
        story.append(reportlab_table)

    pdf.build(story)
    wb.close()
