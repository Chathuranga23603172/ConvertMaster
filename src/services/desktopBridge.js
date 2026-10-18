/**
 * ConvertMaster Desktop Bridge
 * Seamlessly interfaces with Electron IPC for native disk processing and native save dialogs.
 * Automatically falls back to HTTP API if running in a standard web browser.
 */

import { convertFileWithBackend } from './api';
import { downloadFile } from '../utils/fileDownloader';

export const isDesktopApp = () => {
  return typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);
};

/**
 * Perform file conversion.
 * In Electron: Uses direct disk path & child_process via IPC (zero network overhead, byte-level safety).
 * In Web Browser: Uses FormData HTTP upload to FastAPI backend.
 * 
 * @param {File} file - HTML5 File object (has .path in Electron)
 * @param {string} targetFormat - Target extension (e.g. 'pdf', 'docx')
 * @returns {Promise<{blob: Blob, filename: string, size: number, tempPath?: string, isDesktop: boolean}>}
 */
export async function convertUniversal(file, targetFormat) {
  // If running in Electron
  if (isDesktopApp()) {
    let localPath = null;

    // 1. Try webUtils.getPathForFile from Electron 28+ preload bridge
    if (window.electronAPI.getPathForFile && file instanceof File) {
      try {
        localPath = window.electronAPI.getPathForFile(file);
      } catch (err) {
        console.warn('[DesktopBridge] getPathForFile failed:', err);
      }
    }

    // 2. Try file.path directly (Electron legacy or custom file descriptors)
    if (!localPath && file?.path) {
      localPath = file.path;
    }

    // 3. If file is in-memory or path cannot be extracted, write buffer to temp file via IPC
    if (!localPath && (file instanceof File || (file && typeof file.arrayBuffer === 'function'))) {
      try {
        const arrayBuf = await file.arrayBuffer();
        const saveRes = await window.electronAPI.saveBufferToTemp({
          filename: file.name,
          buffer: new Uint8Array(arrayBuf),
        });
        if (saveRes && saveRes.success && saveRes.filePath) {
          localPath = saveRes.filePath;
        }
      } catch (bufErr) {
        console.warn('[DesktopBridge] saveBufferToTemp failed:', bufErr);
      }
    }

    if (localPath) {
      const res = await window.electronAPI.convertLocalFile({
        inputPath: localPath,
        targetFormat,
        promptSave: false // Save will be triggered by user action or Preview
      });

      if (!res.success) {
        throw new Error(res.error || 'Desktop local conversion failed.');
      }

      // Read raw binary buffer from disk to construct a clean Blob for in-app preview/canvas
      let blob = null;
      const fileData = await window.electronAPI.readLocalFile(res.tempPath);
      if (fileData.success && fileData.data) {
        const mimeMap = {
          pdf: 'application/pdf',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          doc: 'application/msword',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          xls: 'application/vnd.ms-excel',
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          webp: 'image/webp',
          txt: 'text/plain',
          csv: 'text/csv',
          html: 'text/html',
        };
        const cleanExt = targetFormat.replace('.', '').toLowerCase();
        blob = new Blob([fileData.data], { type: mimeMap[cleanExt] || 'application/octet-stream' });
      }

      return {
        blob,
        filename: res.filename,
        size: res.sizeBytes,
        tempPath: res.tempPath,
        isDesktop: true
      };
    }
  }

  // Web fallback (FastAPI backend)
  const webResult = await convertFileWithBackend(file, targetFormat);
  return {
    ...webResult,
    isDesktop: false
  };
}

/**
 * Save file locally.
 * In Electron: Opens native `dialog.showSaveDialog` and copies file directly.
 * In Web Browser: Triggers standard browser anchor download.
 */
export async function saveConvertedFileLocally({ tempPath, fileBlob, filename, targetExt }) {
  if (isDesktopApp() && tempPath) {
    const saveResult = await window.electronAPI.saveConvertedFile({
      tempPath,
      defaultName: filename,
      targetExt
    });

    if (!saveResult.canceled && saveResult.savedPath) {
      // Reveal the newly saved file in Windows Explorer or macOS Finder!
      await window.electronAPI.showInFolder(saveResult.savedPath);
      return { saved: true, path: saveResult.savedPath };
    }
    return { saved: false, canceled: true };
  }

  // Web Browser fallback
  downloadFile(fileBlob, filename, targetExt);
  return { saved: true, webDownload: true };
}
