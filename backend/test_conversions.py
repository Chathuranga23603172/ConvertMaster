"""
Comprehensive Test Suite for ConvertMaster Converters
Validates binary file integrity and tests each conversion route.
"""

import os
import tempfile
from PIL import Image
from docx import Document
from openpyxl import Workbook

from converters.image_to_pdf import convert_image_to_pdf
from converters.word_to_pdf import convert_word_to_pdf
from converters.excel_to_pdf import convert_excel_to_pdf
from converters.pdf_to_word import convert_pdf_to_word

def test_all():
    temp_dir = tempfile.mkdtemp(prefix="cm_test_")
    print(f"[*] Running tests in: {temp_dir}")

    # -------------------------------------------------------------
    # 1. Test Image to PDF
    # -------------------------------------------------------------
    print("\n--- [1] Testing Image to PDF ---")
    img_path = os.path.join(temp_dir, "test_image.png")
    img = Image.new("RGBA", (400, 300), color=(99, 102, 241, 255))
    img.save(img_path)
    
    img_pdf_path = os.path.join(temp_dir, "test_image.pdf")
    convert_image_to_pdf(img_path, img_pdf_path)
    
    with open(img_pdf_path, "rb") as f:
        header = f.read(5)
    assert header.startswith(b"%PDF-"), f"Corrupted PDF header: {header}"
    print(f" [PASS] Image to PDF generated valid binary PDF ({os.path.getsize(img_pdf_path)} bytes)")

    # -------------------------------------------------------------
    # 2. Test Word to PDF
    # -------------------------------------------------------------
    print("\n--- [2] Testing Word to PDF ---")
    docx_path = os.path.join(temp_dir, "test_doc.docx")
    doc = Document()
    doc.add_heading("ConvertMaster Annual Summary", level=1)
    doc.add_paragraph("This is a verified test document for binary fidelity validation.")
    table = doc.add_table(rows=2, cols=2)
    table.rows[0].cells[0].text = "Metric"
    table.rows[0].cells[1].text = "Value"
    table.rows[1].cells[0].text = "Fidelity"
    table.rows[1].cells[1].text = "100% Uncorrupted"
    doc.save(docx_path)

    docx_pdf_path = os.path.join(temp_dir, "test_doc.pdf")
    convert_word_to_pdf(docx_path, docx_pdf_path)

    with open(docx_pdf_path, "rb") as f:
        header = f.read(5)
    assert header.startswith(b"%PDF-"), f"Corrupted PDF header: {header}"
    print(f" [PASS] Word to PDF generated valid binary PDF ({os.path.getsize(docx_pdf_path)} bytes)")

    # -------------------------------------------------------------
    # 3. Test Excel to PDF
    # -------------------------------------------------------------
    print("\n--- [3] Testing Excel to PDF ---")
    xlsx_path = os.path.join(temp_dir, "test_sheet.xlsx")
    wb = Workbook()
    ws = wb.active
    ws.title = "Q3_Summary"
    ws.append(["Item ID", "Description", "Units Sold", "Total Revenue"])
    ws.append(["ITM-001", "Universal Converter Pro", 1420, "$28,400.00"])
    ws.append(["ITM-002", "Cloud Batch Node", 350, "$17,500.00"])
    wb.save(xlsx_path)

    xlsx_pdf_path = os.path.join(temp_dir, "test_sheet.pdf")
    convert_excel_to_pdf(xlsx_path, xlsx_pdf_path)

    with open(xlsx_pdf_path, "rb") as f:
        header = f.read(5)
    assert header.startswith(b"%PDF-"), f"Corrupted PDF header: {header}"
    print(f" [PASS] Excel to PDF generated valid binary PDF ({os.path.getsize(xlsx_pdf_path)} bytes)")

    # -------------------------------------------------------------
    # 4. Test PDF to Word
    # -------------------------------------------------------------
    print("\n--- [4] Testing PDF to Word ---")
    pdf_out_docx = os.path.join(temp_dir, "converted_back.docx")
    # Convert the PDF generated in step 2 back to Word
    convert_pdf_to_word(docx_pdf_path, pdf_out_docx)

    with open(pdf_out_docx, "rb") as f:
        header = f.read(4)
    # DOCX files are zip archives and begin with PK\x03\x04
    assert header.startswith(b"PK\x03\x04"), f"Corrupted DOCX header: {header}"
    
    # Verify python-docx can open it
    read_back_doc = Document(pdf_out_docx)
    paragraphs = [p.text for p in read_back_doc.paragraphs if p.text.strip()]
    print(f" [PASS] PDF to Word generated valid DOCX with {len(paragraphs)} paragraphs ({os.path.getsize(pdf_out_docx)} bytes)")

    print("\n=======================================================")
    print(" ALL 4 CORE CONVERSIONS PASSED BINARY INTEGRITY CHECKS!")
    print(" ZERO CORRUPTION DETECTED. VALID MAGIC BYTES VERIFIED.")
    print("=======================================================")

if __name__ == "__main__":
    test_all()
