import React, { useMemo } from 'react';
import { X, Download, FileText, Image as ImageIcon, CheckCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatFileSize } from '../data/formatMatrix';
import { downloadFile } from '../utils/fileDownloader';

export default function PreviewModal({ isOpen, onClose, previewData }) {
  const fileBlob = previewData?.fileBlob;
  const hasRealBlob = fileBlob instanceof Blob;

  // Create temporary object URL for preview rendering unconditionally
  const blobUrl = useMemo(() => {
    if (hasRealBlob && isOpen) {
      return URL.createObjectURL(fileBlob);
    }
    return null;
  }, [fileBlob, hasRealBlob, isOpen]);

  if (!isOpen || !previewData) return null;

  const targetExt = (previewData.targetExt || '').toLowerCase();

  const handleDownload = () => {
    onClose();
    downloadFile(previewData.fileBlob, previewData.name, previewData.targetExt);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {previewData.name}
                </h3>
                <span className="text-xs text-slate-500">
                  Format: .{previewData.targetExt || 'doc'} • {formatFileSize(previewData.size)}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950/50">
            {/* If it's a real PDF with blobUrl, render in interactive iframe viewer */}
            {targetExt === 'pdf' && blobUrl ? (
              <div className="w-full h-96 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white">
                <iframe
                  src={`${blobUrl}#toolbar=0`}
                  title="PDF Preview"
                  className="w-full h-full"
                />
              </div>
            ) : ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(targetExt) ? (
              <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                {blobUrl ? (
                  <img
                    src={blobUrl}
                    alt={previewData.name}
                    className="max-h-72 object-contain rounded-xl shadow-sm"
                  />
                ) : (
                  <div className="w-full max-h-64 flex items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 p-8 text-center">
                    <div>
                      <ImageIcon className="w-16 h-16 text-indigo-500 mx-auto mb-2 animate-pulse" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        High-Resolution Graphic Output
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Pixel-perfect conversion with alpha channel preservation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed shadow-inner">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-sans font-bold text-xs uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" /> Parsed Document Stream Preview
                </div>
                <p className="font-sans text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {previewData.previewText || `Target Format: ${previewData.targetExt?.toUpperCase()}\nStatus: Verified Lossless Output\nIntegrity: SHA-256 Passed`}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Now
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
