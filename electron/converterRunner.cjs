/**
 * ConvertMaster Desktop - Local Converter Runner
 * Spawns the local Python conversion engine via child_process.
 * 
 * ZERO HTTP OVERHEAD: Reads and writes directly to local disk with binary safety.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Robust dev mode detection
function isDevMode() {
  if (process.argv && process.argv.includes('--dev')) return true;
  if (process.env.NODE_ENV === 'development') return true;
  const devScript = path.resolve(__dirname, '..', 'backend', 'cli_converter.py');
  return fs.existsSync(devScript);
}

// Detect Python executable location (Project Venv -> Packaged Resources -> System PATH)
function resolvePythonPath() {
  const rootDir = path.resolve(__dirname, '..');
  const winVenv = path.join(rootDir, 'backend', '.venv', 'Scripts', 'python.exe');
  const posixVenv = path.join(rootDir, 'backend', '.venv', 'bin', 'python');

  // 1. If project virtualenv exists, always prefer it (has all libraries pre-installed)
  if (fs.existsSync(winVenv)) return winVenv;
  if (fs.existsSync(posixVenv)) return posixVenv;

  // 2. In packaged electron distribution, check resources directory
  if (process.resourcesPath) {
    const packagedPython = path.join(process.resourcesPath, 'python', process.platform === 'win32' ? 'python.exe' : 'bin/python');
    if (fs.existsSync(packagedPython)) return packagedPython;
  }

  // 3. Fallback to system PATH python
  return process.platform === 'win32' ? 'python' : 'python3';
}

function resolveScriptPath() {
  if (isDevMode()) {
    const localScript = path.resolve(__dirname, '..', 'backend', 'cli_converter.py');
    if (fs.existsSync(localScript)) return localScript;
  }
  if (process.resourcesPath) {
    const packagedScript = path.join(process.resourcesPath, 'backend', 'cli_converter.py');
    if (fs.existsSync(packagedScript)) return packagedScript;
  }
  return path.resolve(__dirname, '..', 'backend', 'cli_converter.py');
}

/**
 * Execute local conversion via child_process
 * @param {Object} params
 * @param {string} params.inputPath - Absolute path to source file on disk
 * @param {string} params.targetFormat - e.g. 'pdf', 'docx', 'xlsx', 'png'
 * @param {string} [params.outputPath] - Optional destination. If omitted, uses os.tmpdir()
 * @returns {Promise<{outputPath: string, sizeBytes: number, buffer: Buffer}>}
 */
async function runLocalConversion({ inputPath, targetFormat, outputPath }) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Local source file does not exist: ${inputPath}`);
  }

  const stat = await fs.promises.stat(inputPath);
  if (stat.size === 0) {
    throw new Error(`Source file is empty (0 bytes): ${inputPath}`);
  }

  const pythonExec = resolvePythonPath();
  const scriptPath = resolveScriptPath();

  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Converter engine script not found at: ${scriptPath}`);
  }

  // Generate temporary destination if not explicitly provided
  let destination = outputPath;
  if (!destination) {
    const inputExt = path.extname(inputPath);
    const baseName = path.basename(inputPath, inputExt);
    const tempFileName = `cm_${Date.now()}_${baseName}.${targetFormat.replace(/^\./, '')}`;
    destination = path.join(os.tmpdir(), tempFileName);
  }

  const args = [
    scriptPath,
    '--input', inputPath,
    '--target', targetFormat.replace(/^\./, ''),
    '--output', destination
  ];

  return new Promise((resolve, reject) => {
    let stdoutData = '';
    let stderrData = '';

    const proc = spawn(pythonExec, args, {
      windowsHide: true,
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    proc.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to start local Python engine (${pythonExec}): ${err.message}`));
    });

    proc.on('close', async (code) => {
      if (code !== 0) {
        let cleanError = stderrData.trim();
        // Try parsing JSON error from stdout if present
        try {
          const jsonErr = JSON.parse(stdoutData.trim());
          if (jsonErr && jsonErr.error) cleanError = jsonErr.error;
        } catch (_) {}

        return reject(new Error(cleanError || `Conversion failed with exit code ${code}`));
      }

      try {
        // Parse JSON output (scanning backwards across lines to safely skip library warnings/logs)
        const lines = stdoutData.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        let result = null;
        for (let i = lines.length - 1; i >= 0; i--) {
          if (lines[i].startsWith('{') && lines[i].endsWith('}')) {
            try {
              result = JSON.parse(lines[i]);
              break;
            } catch (_) {}
          }
        }

        if (!result) {
          throw new Error(`No JSON output returned from conversion engine. Output: ${stdoutData}`);
        }

        if (!result.success) {
          return reject(new Error(result.error || 'Conversion reported failure.'));
        }

        // Verify output file exists and is non-empty
        if (!fs.existsSync(destination)) {
          return reject(new Error(`Output file was not created at ${destination}`));
        }

        const outStat = await fs.promises.stat(destination);
        if (outStat.size === 0) {
          return reject(new Error(`Converted file is corrupted (0 bytes).`));
        }

        resolve({
          success: true,
          inputPath,
          outputPath: destination,
          sizeBytes: outStat.size,
          filename: path.basename(destination)
        });
      } catch (err) {
        reject(new Error(`Failed to verify converted output: ${err.message}. Raw output: ${stdoutData}`));
      }
    });
  });
}

module.exports = {
  runLocalConversion,
  resolvePythonPath,
  resolveScriptPath
};
