import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileUp, 
  FileText, 
  Image as ImageIcon, 
  Table as TableIcon, 
  Video as VideoIcon, 
  Sparkles, 
  FolderOpen,
  Shield,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SAMPLE_FILES } from '../data/formatMatrix';

export default function DropZone({ 
  onFileSelect, 
  onSampleSelect, 
  isDragging, 
  setIsDragging,
  multiple = false 
}) {
  const fileInputRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (multiple) {
        onFileSelect(Array.from(e.dataTransfer.files));
      } else {
        onFileSelect(e.dataTransfer.files[0]);
      }
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (multiple) {
        onFileSelect(Array.from(e.target.files));
      } else {
        onFileSelect(e.target.files[0]);
      }
    }
  };

  // Allow pasting files from clipboard (e.g. screenshots)
  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (multiple) {
        onFileSelect([file]);
      } else {
        onFileSelect(file);
      }
    }
  };

  return (
    <div 
      className="w-full max-w-3xl mx-auto"
      onPaste={handlePaste}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        multiple={multiple}
        id="file-upload-input"
      />

      {/* Main Drag & Drop Zone */}
      <motion.div
        whileHover={{ scale: 1.008 }}
        whileTap={{ scale: 0.995 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-3xl p-8 sm:p-14 text-center transition-all duration-300 ${
          isDragging
            ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-2 border-indigo-500 scale-[1.01] shadow-2xl shadow-indigo-500/20'
            : 'glass-card-elevated border-2 border-dashed border-indigo-200/80 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10'
        }`}
      >
        {/* Soft floating background orb */}
        <div className={`absolute inset-0 rounded-3xl transition-opacity duration-500 pointer-events-none ${
          isHovered || isDragging 
            ? 'bg-gradient-to-b from-indigo-500/5 via-purple-500/5 to-transparent opacity-100' 
            : 'opacity-0'
        }`} />

        <div className="relative z-10 flex flex-col items-center justify-center">
          
          {/* Cloud Upload Icon Container */}
          <div className="relative mb-6">
            <motion.div
              animate={isDragging ? { y: -8, scale: 1.1 } : { y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-xl shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300"
            >
              <div className="w-full h-full rounded-[22px] bg-white dark:bg-slate-900 flex items-center justify-center">
                {isDragging ? (
                  <FileUp className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600 dark:text-indigo-400 animate-bounce" />
                ) : (
                  <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                )}
              </div>
            </motion.div>

            {/* Corner floating sparkle badge */}
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-amber-500">
              <Sparkles className="w-4 h-4 fill-amber-400" />
            </div>
          </div>

          {/* Primary Text */}
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-800 dark:text-white tracking-tight">
            {isDragging ? (
              <span className="text-indigo-600 dark:text-indigo-400">Release to Drop Files Now</span>
            ) : (
              <span>
                Drag & drop your {multiple ? 'files' : 'file'} here, or{' '}
                <span className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-400/40 underline-offset-4 group-hover:decoration-indigo-500">
                  browse files
                </span>
              </span>
            )}
          </h2>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Supports PDF, Word, Excel, JPG, PNG, MP4, MP3, and 100+ file extensions up to 2 GB per file.
          </p>

          {/* Action Browse Button */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/30 group-hover:scale-105 active:scale-95 transition-all duration-200">
              <FolderOpen className="w-4 h-4" />
              Choose File from Device
            </span>
          </div>

          {/* Secondary hint */}
          <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/60 w-full max-w-sm flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" /> End-to-end encrypted
            </span>
            <span>•</span>
            <span>Paste clipboard (Ctrl+V)</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Test with Sample Files */}
      <div className="mt-6 p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Don't have a file ready? Try an instant demo file:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_FILES.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSampleSelect(sample);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all duration-150"
              >
                {sample.category === 'document' && <FileText className="w-3 h-3 text-blue-500" />}
                {sample.category === 'image' && <ImageIcon className="w-3 h-3 text-purple-500" />}
                {sample.category === 'spreadsheet' && <TableIcon className="w-3 h-3 text-emerald-500" />}
                {sample.category === 'video' && <VideoIcon className="w-3 h-3 text-rose-500" />}
                <span>.{sample.extension.toUpperCase()} Demo</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
