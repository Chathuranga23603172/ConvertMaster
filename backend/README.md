# ConvertMaster Backend API

High-performance, uncorrupted file conversion API built with **FastAPI** and modern document processing libraries.

---

## 🛠️ Required Pip Packages

Install the dependencies into your virtual environment:

```bash
# Core API & Server
pip install fastapi uvicorn python-multipart

# Document & Spreadsheet Converters
pip install pdf2docx docx2pdf python-docx openpyxl reportlab

# Image Processing
pip install pillow
```

*(All pinned dependencies are saved in [`requirements.txt`](./requirements.txt).)*

---

## 🛡️ How the File Corruption Issue Was Fixed

The error `"We can't open this file"` in PDF viewers is caused by three subtle defects that have been completely resolved here:

1. **Binary Stream Handling**:
   - Both uploads and downloads must be read and written strictly in binary mode (`'wb'` and `'rb'`).
   - Using string decoding or `.text()` decodes binary bytes as UTF-8, which replaces non-ASCII bytes (> `0x7F`) with the Unicode replacement character `\uFFFD` (bytes `EF BF BD`) and truncates on null bytes `0x00`, destroying the PDF cross-reference table (`XREF`) and trailer dictionary.

2. **Temporary File Deletion Race Conditions**:
   - Deleting temporary files in a `finally` block or context manager removes the file while FastAPI's `FileResponse` is still actively streaming chunks over the socket to the client. This truncates the file to 0 bytes or sends an incomplete payload.
   - **Fix**: We use FastAPI's `BackgroundTasks.add_task(cleanup_directory, temp_dir)`. This guarantees that cleanup is triggered **only after the HTTP response body has finished transmitting completely**.

3. **HTTP Response Headers & RFC 5987**:
   - `Content-Type: application/pdf` (or `application/vnd.openxmlformats-officedocument.wordprocessingml.document` for Word).
   - `Content-Disposition: attachment; filename="..."; filename*=UTF-8''...` with proper URL encoding.
   - `Content-Length: <exact_byte_count>` so browsers know the file boundary and don't close the stream prematurely.
   - `Cache-Control: no-cache, no-store, must-revalidate` to prevent corrupted partial caching.

4. **Frontend Binary Blob Consumption**:
   - In JavaScript/React, always consume file responses using `await response.blob()` instead of `response.text()` or `response.json()`.

---

## 🚀 Running the Backend

### Windows (Batch script):
```cmd
cd backend
run.bat
```

### Windows (PowerShell):
```powershell
cd backend
.\run.ps1
```

### Manual CLI:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger documentation is available at:
**`http://localhost:8000/docs`**

---

## 📡 API Endpoints

### 1. Word to PDF
`POST /convert/word-to-pdf`
- Multipart form field: `file` (`.docx`, `.doc`)
- Response: Binary PDF stream

### 2. PDF to Word
`POST /convert/pdf-to-word`
- Multipart form field: `file` (`.pdf`)
- Response: Binary `.docx` stream

### 3. Excel to PDF
`POST /convert/excel-to-pdf`
- Multipart form field: `file` (`.xlsx`, `.xls`)
- Response: Binary PDF stream

### 4. Image to PDF
`POST /convert/image-to-pdf`
- Multipart form field: `files` (supports multiple `.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`)
- Response: Unified binary PDF stream

### 5. Universal Router
`POST /convert/universal`
- Multipart form fields: `file` + `target_format` (e.g. `pdf`, `docx`, `png`, `webp`)
