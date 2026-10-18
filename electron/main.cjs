/**
 * ConvertMaster Desktop - Electron Main Process
 * 
 * High-performance, binary-safe local conversion desktop application.
 * Manages native window frames, OS file dialogs, and child_process conversions.
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { runLocalConversion } = require('./converterRunner.cjs');

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 860,
    minWidth: 940,
    minHeight: 680,
    frame: false, // Custom modern glassmorphic titlebar
    titleBarStyle: 'hidden',
    backgroundColor: '#090D16',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  // Smooth window reveal when content is painted
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Window state notification for maximize/restore UI buttons
  mainWindow.on('maximize', () => mainWindow.webContents.send('window-state-changed', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-state-changed', false));

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl);
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Prevent external link navigation inside Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// -------------------------------------------------------------
// IPC Communication Handlers
// -------------------------------------------------------------

// Window management
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Native Open File Dialog
ipcMain.handle('dialog-open-file', async (event, options = {}) => {
  const defaultFilters = [
    { name: 'All Supported Documents & Media', extensions: ['docx', 'doc', 'pdf', 'xlsx', 'xls', 'png', 'jpg', 'jpeg', 'webp', 'txt', 'csv'] },
    { name: 'Word Documents', extensions: ['docx', 'doc'] },
    { name: 'PDF Documents', extensions: ['pdf'] },
    { name: 'Spreadsheets', extensions: ['xlsx', 'xls', 'csv'] },
    { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'] },
    { name: 'All Files', extensions: ['*'] }
  ];

  const result = await dialog.showOpenDialog(mainWindow, {
    title: options.title || 'Select File to Convert',
    properties: options.multi ? ['openFile', 'multiSelections'] : ['openFile'],
    filters: options.filters || defaultFilters,
  });

  if (result.canceled || !result.filePaths.length) {
    return { canceled: true, files: [] };
  }

  // Retrieve basic file metadata directly from local disk
  const filesMetadata = await Promise.all(
    result.filePaths.map(async (fPath) => {
      const stat = await fs.promises.stat(fPath);
      return {
        path: fPath,
        name: path.basename(fPath),
        size: stat.size,
        extension: path.extname(fPath).replace('.', '').toLowerCase()
      };
    })
  );

  return { canceled: false, files: filesMetadata };
});

// Native Save File Dialog
ipcMain.handle('dialog-save-file', async (event, options = {}) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: options.title || 'Save Converted File',
    defaultPath: options.defaultPath || 'converted_document',
    filters: options.filters || [{ name: 'All Files', extensions: ['*'] }]
  });

  return {
    canceled: result.canceled,
    filePath: result.filePath
  };
});

// Direct Local File Conversion
ipcMain.handle('convert-local-file', async (event, { inputPath, targetFormat, promptSave = false }) => {
  try {
    // 1. Run local conversion
    const conversionResult = await runLocalConversion({
      inputPath,
      targetFormat,
    });

    // 2. If promptSave is true, open native dialog immediately
    if (promptSave) {
      const defaultFileName = `${path.basename(inputPath, path.extname(inputPath))}.${targetFormat.replace('.', '')}`;
      const saveChoice = await dialog.showSaveDialog(mainWindow, {
        title: 'Choose Destination for Converted File',
        defaultPath: defaultFileName,
        filters: [
          { name: `${targetFormat.toUpperCase()} Document`, extensions: [targetFormat.replace('.', '')] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!saveChoice.canceled && saveChoice.filePath) {
        // Copy temporary output to user destination with binary safety
        await fs.promises.copyFile(conversionResult.outputPath, saveChoice.filePath);
        return {
          success: true,
          savedDirectly: true,
          savedPath: saveChoice.filePath,
          filename: path.basename(saveChoice.filePath),
          sizeBytes: conversionResult.sizeBytes
        };
      }
    }

    return {
      success: true,
      savedDirectly: false,
      tempPath: conversionResult.outputPath,
      filename: conversionResult.filename,
      sizeBytes: conversionResult.sizeBytes
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
});

// Save converted file from temp to chosen destination
ipcMain.handle('save-converted-file', async (event, { tempPath, defaultName, targetExt }) => {
  try {
    if (!tempPath || !fs.existsSync(tempPath)) {
      throw new Error('Temporary converted file no longer exists. Please re-run conversion.');
    }

    const cleanExt = (targetExt || path.extname(tempPath)).replace('.', '');
    const cleanDefault = defaultName ? defaultName : path.basename(tempPath);

    const saveChoice = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Converted File',
      defaultPath: cleanDefault,
      filters: [
        { name: `${cleanExt.toUpperCase()} Document`, extensions: [cleanExt] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (saveChoice.canceled || !saveChoice.filePath) {
      return { canceled: true };
    }

    await fs.promises.copyFile(tempPath, saveChoice.filePath);

    return {
      canceled: false,
      savedPath: saveChoice.filePath,
      filename: path.basename(saveChoice.filePath)
    };
  } catch (err) {
    return {
      canceled: false,
      error: err.message
    };
  }
});

// Read local file as raw binary Buffer for renderer display/preview
ipcMain.handle('read-local-file', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist: ' + filePath);
    }
    const buffer = await fs.promises.readFile(filePath);
    return { success: true, data: buffer };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Save in-memory file buffer from renderer directly into temp directory
ipcMain.handle('save-buffer-to-temp', async (event, { filename, buffer }) => {
  try {
    const tempDir = os.tmpdir();
    const safeName = filename ? path.basename(filename) : `temp_${Date.now()}.bin`;
    const tempFilePath = path.join(tempDir, `cm_${Date.now()}_${safeName}`);
    await fs.promises.writeFile(tempFilePath, Buffer.from(buffer));
    return { success: true, filePath: tempFilePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Shell integrations
ipcMain.handle('show-in-folder', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

ipcMain.handle('open-external', async (event, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

// App Lifecycle
app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
