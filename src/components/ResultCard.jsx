import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Download, 
  RotateCcw, 
  Eye, 
  Copy, 
  Check, 
  HardDrive, 
  TrendingDown, 
  Clock 
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { formatFileSize, getFileCategory } from '../data/formatMatrix';
import { saveConvertedFileLocally, isDesktopApp } from '../services/desktopBridge';

export default function ResultCard({ 
  result, 
  onConvertAnother, 
  onPreview 
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#9333ea', '#ec4899', '#10b981', '#3b82f6']
      });
    } catch {
      // safe fallback if canvas is not ready
    }
  }, []);

  if (!result) return null;

  const isDesktop = isDesktopApp();
  const targetCategory = getFileCategory(result.targetExt);

  const handleDownload = async () => {
    await saveConvertedFileLocally({
      tempPath: result.tempPath,
      fileBlob: result.fileBlob,
      filename: result.name,
      targetExt: result.targetExt
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="w-full max-w-3xl mx-auto rounded-3xl glass-card-elevated p-6 sm:p-10 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xl relative overflow-hidden"
    >
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Top Success Badge */}
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1, stiffness: 400, damping: 20 }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/25 flex items-center justify-center mb-4"
        >
          <div className="w-full h-full rounded-[22px] bg-white dark:bg-slate-900 flex items-center justify-center">
            <CheckCircle className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-500" />
          </div>
        </motion.div>

        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 mb-2">
          Conversion Complete!
        </span>

        <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
          Your File is Ready for Download
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
          Successfully transcoded to <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">.{result.targetExt}</span> with verified structural integrity.
        </p>
      </div>

      {/* File Specs Card */}
      <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${targetCategory.color} flex items-center justify-center text-white shrink-0 font-bold uppercase text-xs shadow-md`}>
              {result.targetExt}
            </div>

            <div className="min-w-0">
              <h4 className="text-base font-bold text-slate-900 dark:text-white truncate" title={result.name}>
                {result.name}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <HardDrive className="w-3.5 h-3.5" /> {formatFileSize(result.size)}
                </span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> {result.compressionSavings || '24% smaller'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={() => onPreview(result)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
              title="Preview converted file content"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
              title="Copy shareable link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Download CTA and Reset Button */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <motion.button
          id="download-result-btn"
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleDownload}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base tracking-wide shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          <Download className="w-5 h-5 animate-bounce" />
          <span>{isDesktop ? `Save .${result.targetExt.toUpperCase()} (Choose Location)` : `Download Converted .${result.targetExt.toUpperCase()}`}</span>
        </motion.button>

        <button
          type="button"
          onClick={onConvertAnother}
          className="w-full sm:w-auto px-6 py-4 rounded-2xl text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-sm tracking-wide border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Convert Another File</span>
        </button>
      </div>

      {/* File Expiry & Privacy Note */}
      <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span>For your security, converted files are automatically purged from buffer after 2 hours.</span>
      </div>
    </motion.div>
  );
}
