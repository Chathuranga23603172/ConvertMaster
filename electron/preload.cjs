/**
 * ConvertMaster Desktop - Secure Preload Script
 * Exposes a typed, context-isolated bridge to the React renderer.
 * 
 * Complies with OWASP & Electron Security Guidelines:
 * - contextIsolation: true
 * - nodeIntegration: false
 * - Sandboxed IPC communication
 */

const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // Path resolution for DOM File objects (Electron 28+)
  getPathForFile: (file) => {
    try {
      if (!file) return null;
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file);
      }
      return file.path || null;
    } catch {
      return file?.path || null;
    }
  },

  // Save in-memory file buffer directly to temporary disk for local conversion
  saveBufferToTemp: (payload) => ipcRenderer.invoke('save-buffer-to-temp', payload),

  // Window Controls (for Custom Modern Titlebar)
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  },

  // Native File Picker Dialog
  selectLocalFile: (options = {}) => ipcRenderer.invoke('dialog-open-file', options),

  // Native Save File Dialog & Writing
  saveFileDialog: (options = {}) => ipcRenderer.invoke('dialog-save-file', options),

  // Direct Local Conversion (zero HTTP)
  convertLocalFile: (payload) => ipcRenderer.invoke('convert-local-file', payload),

  // Save converted file from temp to user destination
  saveConvertedFile: (payload) => ipcRenderer.invoke('save-converted-file', payload),

  // Read binary file directly from disk into Uint8Array
  readLocalFile: (filePath) => ipcRenderer.invoke('read-local-file', filePath),

  // OS Integration
  showInFolder: (filePath) => ipcRenderer.invoke('show-in-folder', filePath),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
