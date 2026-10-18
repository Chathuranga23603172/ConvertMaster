"""
Universal File Converter - High-Performance FastAPI Backend
Designed for zero-corruption binary file processing and instant browser downloads.
"""

import os
import shutil
import tempfile
import urllib.parse
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Import converters
from converters.word_to_pdf import convert_word_to_pdf
from converters.pdf_to_word import convert_pdf_to_word
from converters.excel_to_pdf import convert_excel_to_pdf
from converters.image_to_pdf import convert_image_to_pdf

# Import OAuth 2.0 / OIDC security router
from auth.router import router as auth_router

app = FastAPI(
    title="ConvertMaster API",
    description="High-fidelity, uncorrupted universal file conversion backend API",
    version="2.0.0"
)

# Include OAuth / OIDC Authentication Router
app.include_router(auth_router)

# Enable CORS for all frontend origins (React / Vite on localhost:5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length"],
)


def cleanup_directory(path: str):
    """
    Safely delete temporary directory and its contents after
    the file download has completely finished streaming.
    """
    try:
        if os.path.exists(path):
            shutil.rmtree(path, ignore_errors=True)
    except Exception as e:
        print(f"[Warning] Failed to cleanup temp directory {path}: {e}")


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and header injection."""
    clean = os.path.basename(filename)
    return clean.replace('"', '').replace("'", '').replace(";", "")


def build_binary_file_response(
    file_path: str,
    download_filename: str,
    media_type: str,
    background_tasks: BackgroundTasks,
    temp_dir: str
) -> FileResponse:
    """
    Builds a byte-for-byte uncorrupted FileResponse with standard RFC headers.
    Ensures temporary directory is cleaned up ONLY after the stream finishes.
    """
    if not os.path.exists(file_path):
        cleanup_directory(temp_dir)
        raise HTTPException(status_code=500, detail="Converted output file was not found on server.")

    file_size = os.path.getsize(file_path)
    if file_size == 0:
        cleanup_directory(temp_dir)
        raise HTTPException(status_code=500, detail="Generated output file is empty (0 bytes).")

    # Encode filename for RFC 5987 compatibility (handles unicode characters)
    encoded_filename = urllib.parse.quote(download_filename)

    headers = {
        "Content-Disposition": f'attachment; filename="{download_filename}"; filename*=UTF-8\'\'{encoded_filename}',
        "Content-Length": str(file_size),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
    }

    # Register cleanup in background_tasks (triggers AFTER response transmission)
    background_tasks.add_task(cleanup_directory, temp_dir)

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=download_filename,
        headers=headers,
        background=background_tasks
    )


# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------

@app.get("/health")
def health_check():
    """Service health check and capabilities."""
    return {
        "status": "healthy",
        "service": "ConvertMaster API",
        "engine": "FastAPI + WebAssembly/Python",
        "supported_conversions": [
            "word-to-pdf",
            "pdf-to-word",
            "excel-to-pdf",
            "image-to-pdf",
            "universal"
        ]
    }


@app.post("/convert/word-to-pdf")
async def endpoint_word_to_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Convert a Word (.docx / .doc) document to a PDF file.
    Guarantees pure binary stream generation without text truncation.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".docx", ".doc"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .docx or .doc file.")

    temp_dir = tempfile.mkdtemp(prefix="cm_word_")
    try:
        input_path = os.path.join(temp_dir, sanitize_filename(file.filename))
        
        # Read and write in binary mode ('wb')
        with open(input_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                f.write(chunk)

        base_name = os.path.splitext(file.filename)[0]
        output_filename = f"{base_name}.pdf"
        output_path = os.path.join(temp_dir, output_filename)

        convert_word_to_pdf(input_path, output_path)

        return build_binary_file_response(
            file_path=output_path,
            download_filename=output_filename,
            media_type="application/pdf",
            background_tasks=background_tasks,
            temp_dir=temp_dir
        )
    except Exception as e:
        cleanup_directory(temp_dir)
        raise HTTPException(status_code=500, detail=f"Word to PDF conversion failed: {str(e)}")


@app.post("/convert/pdf-to-word")
async def endpoint_pdf_to_word(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Convert a PDF file to an editable Word (.docx) document.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext != ".pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .pdf file.")

    temp_dir = tempfile.mkdtemp(prefix="cm_pdf_")
    try:
        input_path = os.path.join(temp_dir, sanitize_filename(file.filename))
        
        # Read and write in binary mode
        with open(input_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                f.write(chunk)

        base_name = os.path.splitext(file.filename)[0]
        output_filename = f"{base_name}.docx"
        output_path = os.path.join(temp_dir, output_filename)

        convert_pdf_to_word(input_path, output_path)

        return build_binary_file_response(
            file_path=output_path,
            download_filename=output_filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            background_tasks=background_tasks,
            temp_dir=temp_dir
        )
    except Exception as e:
        cleanup_directory(temp_dir)
        raise HTTPException(status_code=500, detail=f"PDF to Word conversion failed: {str(e)}")


@app.post("/convert/excel-to-pdf")
async def endpoint_excel_to_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Convert an Excel (.xlsx / .xls) spreadsheet to a PDF document.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".xlsx", ".xls"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .xlsx or .xls file.")

    temp_dir = tempfile.mkdtemp(prefix="cm_excel_")
    try:
        input_path = os.path.join(temp_dir, sanitize_filename(file.filename))
        
        # Binary write
        with open(input_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                f.write(chunk)

        base_name = os.path.splitext(file.filename)[0]
        output_filename = f"{base_name}.pdf"
        output_path = os.path.join(temp_dir, output_filename)

        convert_excel_to_pdf(input_path, output_path)

        return build_binary_file_response(
            file_path=output_path,
            download_filename=output_filename,
            media_type="application/pdf",
            background_tasks=background_tasks,
            temp_dir=temp_dir
        )
    except Exception as e:
        cleanup_directory(temp_dir)
        raise HTTPException(status_code=500, detail=f"Excel to PDF conversion failed: {str(e)}")


@app.post("/convert/image-to-pdf")
async def endpoint_image_to_pdf(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    """
    Convert one or more images (PNG, JPG, JPEG, WEBP, BMP, TIFF) into a unified PDF.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No image files provided.")

    valid_extensions = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".gif"]
    temp_dir = tempfile.mkdtemp(prefix="cm_img_")
    try:
        saved_paths = []
        first_base_name = os.path.splitext(files[0].filename)[0]

        for uploaded in files:
            ext = os.path.splitext(uploaded.filename)[1].lower()
            if ext not in valid_extensions:
                raise HTTPException(status_code=400, detail=f"Unsupported image format: {ext}")
            
            p = os.path.join(temp_dir, sanitize_filename(uploaded.filename))
            with open(p, "wb") as f:
                while chunk := await uploaded.read(1024 * 1024):
                    f.write(chunk)
            saved_paths.append(p)

        output_filename = f"{first_base_name}.pdf"
        output_path = os.path.join(temp_dir, output_filename)

        convert_image_to_pdf(saved_paths, output_path)

        return build_binary_file_response(
            file_path=output_path,
            download_filename=output_filename,
            media_type="application/pdf",
            background_tasks=background_tasks,
            temp_dir=temp_dir
        )
    except Exception as e:
        cleanup_directory(temp_dir)
        raise HTTPException(status_code=500, detail=f"Image to PDF conversion failed: {str(e)}")


@app.post("/convert/universal")
async def endpoint_universal_converter(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_format: str = Form(...)
):
    """
    Universal routing endpoint: Automatically inspects the source extension and target format,
    invoking the appropriate conversion pipeline.
    """
    source_ext = os.path.splitext(file.filename)[1].lower().replace('.', '')
    target_ext = target_format.lower().replace('.', '')
    base_name = os.path.splitext(file.filename)[0]

    # Route 1: Word to PDF
    if source_ext in ["docx", "doc"] and target_ext == "pdf":
        return await endpoint_word_to_pdf(background_tasks, file)

    # Route 2: PDF to Word
    if source_ext == "pdf" and target_ext in ["docx", "doc"]:
        return await endpoint_pdf_to_word(background_tasks, file)

    # Route 3: Excel to PDF
    if source_ext in ["xlsx", "xls"] and target_ext == "pdf":
        return await endpoint_excel_to_pdf(background_tasks, file)

    # Route 4: Image to PDF
    if source_ext in ["png", "jpg", "jpeg", "webp", "bmp", "gif"] and target_ext == "pdf":
        return await endpoint_image_to_pdf(background_tasks, [file])

    # Route 5: Image to Image format (e.g. PNG to JPG, JPG to WEBP, WEBP to PNG)
    image_formats = ["png", "jpg", "jpeg", "webp", "bmp", "ico", "gif"]
    if source_ext in image_formats and target_ext in image_formats:
        temp_dir = tempfile.mkdtemp(prefix="cm_img_trans_")
        try:
            input_path = os.path.join(temp_dir, sanitize_filename(file.filename))
            with open(input_path, "wb") as f:
                while chunk := await file.read(1024 * 1024):
                    f.write(chunk)

            output_filename = f"{base_name}.{target_ext}"
            output_path = os.path.join(temp_dir, output_filename)

            from PIL import Image
            img = Image.open(input_path)
            if target_ext in ["jpg", "jpeg"]:
                img = img.convert("RGB")
            
            save_format = "JPEG" if target_ext in ["jpg", "jpeg"] else target_ext.upper()
            img.save(output_path, format=save_format)

            media_map = {
                "png": "image/png",
                "jpg": "image/jpeg",
                "jpeg": "image/jpeg",
                "webp": "image/webp",
                "gif": "image/gif",
                "bmp": "image/bmp",
                "ico": "image/x-icon",
            }
            media_type = media_map.get(target_ext, "application/octet-stream")

            return build_binary_file_response(
                file_path=output_path,
                download_filename=output_filename,
                media_type=media_type,
                background_tasks=background_tasks,
                temp_dir=temp_dir
            )
        except Exception as e:
            cleanup_directory(temp_dir)
            raise HTTPException(status_code=500, detail=f"Image conversion failed: {str(e)}")

    raise HTTPException(
        status_code=400,
        detail=f"Conversion route from .{source_ext} to .{target_ext} is currently not supported."
    )


if __name__ == "__main__":
    import uvicorn
    # Run API on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
