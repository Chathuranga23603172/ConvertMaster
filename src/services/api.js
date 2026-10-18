/**
 * ConvertMaster API Client Service
 * Connects the React frontend to the FastAPI Python backend.
 * 
 * CRITICAL FIX FOR CORRUPTED PDFS:
 * Always consume binary file streams using `response.blob()` instead of `response.text()`
 * to preserve raw byte sequences, EOF markers, and PDF trailer dictionaries intact.
 */

const API_BASE_URL = 'http://localhost:8000';

export async function convertFileWithBackend(file, targetFormat) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_format', targetFormat);

  // Set 25-second timeout controller to prevent hanging forever
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(`${API_BASE_URL}/convert/universal`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) errorMessage = errorJson.detail;
      } catch (e) {}
      throw new Error(errorMessage);
    }

    // Retrieve filename from Content-Disposition header if available
    let filename = `${file.name.substring(0, file.name.lastIndexOf('.'))}.${targetFormat}`;
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    // ALWAYS extract as binary Blob to prevent text decoding corruption
    const blob = await response.blob();

    return {
      blob,
      filename,
      size: blob.size,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Conversion request timed out. Please try again.');
    }
    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      throw new Error('Cannot connect to conversion service at http://localhost:8000. If running in a web browser, please ensure the Python backend is started (run "run.bat" or "uvicorn main:app --port 8000" in the backend directory).');
    }
    throw err;
  }
}

export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE_URL}/health`, { 
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch (err) {
    return false;
  }
}
