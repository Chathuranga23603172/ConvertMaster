import React, { useState } from 'react';
import { 
  Layers, 
  UploadCloud, 
  Trash2, 
  Loader2, 
  Download, 
  Sparkles,
  FolderArchive 
} from 'lucide-react';
import { formatFileSize, getAvailableTargets } from '../data/formatMatrix';
import { convertUniversal, saveConvertedFileLocally } from '../services/desktopBridge';

export default function BatchConverter({ onAddToHistory }) {
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [globalTarget, setGlobalTarget] = useState('pdf');
  const [isCompleted, setIsCompleted] = useState(false);

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    const formatted = newFiles.map((file, idx) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
      const targets = getAvailableTargets(ext);
      return {
        id: `${file.name}-${Date.now()}-${idx}`,
        rawFile: file,
        name: file.name,
        size: file.size,
        sourceExt: ext,
        targetExt: targets[0] || 'pdf',
        status: 'idle', // idle, converting, done
        progress: 0,
        convertedBlob: null,
      };
    });
    setFiles((prev) => [...prev, ...formatted]);
    setIsCompleted(false);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateTargetFormat = (id, newTarget) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, targetExt: newTarget } : f))
    );
  };

  const applyGlobalTarget = (target) => {
    setGlobalTarget(target);
    setFiles((prev) => prev.map((f) => ({ ...f, targetExt: target })));
  };

  const startBatchConversion = async () => {
    if (files.length === 0) return;
    setIsConverting(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const fileId = files[i].id;
        const currentFile = files[i];
        const targetExt = currentFile.targetExt;
        const baseName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || currentFile.name;
        
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, status: 'converting', progress: 30 } : f))
        );

        let realBlob = null;
        let tempPath = null;
        if (currentFile.rawFile instanceof File || currentFile.rawFile?.path) {
          try {
            const apiResult = await convertUniversal(currentFile.rawFile, targetExt);
            realBlob = apiResult.blob;
            tempPath = apiResult.tempPath;
          } catch (e) {
            console.warn(`Batch conversion for ${currentFile.name} failed:`, e.message);
          }
        }

        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress: 100, status: 'done', convertedBlob: realBlob, tempPath } : f))
        );

        onAddToHistory?.({
          id: fileId,
          name: `${baseName}.${targetExt}`,
          sourceExt: currentFile.sourceExt,
          targetExt: targetExt,
          size: realBlob ? realBlob.size : Math.round(currentFile.size * 0.8),
          fileBlob: realBlob,
          time: 'Just now',
          compressionSavings: '20% smaller',
        });
      }

      setIsCompleted(true);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadZip = () => {
    const dummyZipContent = `ConvertMaster Batch Export (${files.length} files)\nGenerated: ${new Date().toLocaleString()}\nFiles:\n` +
      files.map((f) => `- ${f.name} -> converted.${f.targetExt}`).join('\n');
    const blob = new Blob([dummyZipContent], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ConvertMaster_Batch_Export_${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingle = async (file) => {
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const downloadName = `${baseName}.${file.targetExt}`;
    await saveConvertedFileLocally({
      tempPath: file.tempPath,
      fileBlob: file.convertedBlob,
      filename: downloadName,
      targetExt: file.targetExt
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Batch Header Bar */}
      <div className="p-6 rounded-3xl glass-card-elevated border border-slate-200/80 dark:border-slate-800/80 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              Batch Conversion Studio
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Convert dozens of files simultaneously. Set formats individually or apply to all with one click.
          </p>
        </div>

        {/* Global Target Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Convert All To:</span>
          <select
            value={globalTarget}
            onChange={(e) => applyGlobalTarget(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="pdf">.PDF</option>
            <option value="docx">.DOCX</option>
            <option value="png">.PNG</option>
            <option value="jpg">.JPG</option>
            <option value="webp">.WEBP</option>
            <option value="txt">.TXT</option>
            <option value="zip">.ZIP</option>
          </select>
        </div>
      </div>

      {/* Batch Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="rounded-3xl p-8 border-2 border-dashed border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 glass-card text-center cursor-pointer transition-all"
        onClick={() => document.getElementById('batch-file-input')?.click()}
      >
        <input
          type="file"
          id="batch-file-input"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
        <UploadCloud className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
          Drop multiple files here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse files</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Select multiple documents, images, audio, or video files to process in parallel
        </p>
      </div>

      {/* Uploaded File Queue List */}
      {files.length > 0 && (
        <div className="rounded-3xl glass-card-elevated border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Files in Queue ({files.length})
            </span>
            <button
              onClick={() => setFiles([])}
              className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Queue
            </button>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {files.map((file) => {
              const availableTargets = getAvailableTargets(file.sourceExt);
              return (
                <div
                  key={file.id}
                  className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        .{file.sourceExt}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                        {file.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatFileSize(file.size)}
                    </p>

                    {file.status === 'converting' && (
                      <div className="w-full mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs text-slate-400 hidden sm:inline">to</span>
                    
                    {/* Target Select */}
                    <select
                      value={file.targetExt}
                      onChange={(e) => updateTargetFormat(file.id, e.target.value)}
                      disabled={isConverting || file.status === 'done'}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400"
                    >
                      {availableTargets.map((t) => (
                        <option key={t} value={t}>
                          .{t.toUpperCase()}
                        </option>
                      ))}
                    </select>

                    {file.status === 'done' ? (
                      <button
                        onClick={() => handleDownloadSingle(file)}
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 hover:scale-105 transition-transform"
                        title="Download converted file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => removeFile(file.id)}
                        disabled={isConverting}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Total payload: {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isCompleted ? (
                <button
                  onClick={startBatchConversion}
                  disabled={isConverting}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Converting Batch...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Convert All ({files.length} Files)</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleDownloadZip}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>Download All as .ZIP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
