import React from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Table, 
  Music, 
  Video, 
  Archive, 
  File, 
  Trash2, 
  RefreshCw,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize, getFileCategory } from '../data/formatMatrix';

export default function FileDetailsCard({ file, onRemove, onReplace }) {
  if (!file) return null;

  const fileName = file.name || 'uploaded-file';
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const categoryInfo = getFileCategory(extension);
  const sizeFormatted = formatFileSize(file.size);

  const renderIcon = () => {
    const iconClass = "w-7 h-7 sm:w-8 sm:h-8 text-white";
    switch (categoryInfo.categoryKey) {
      case 'document': return <FileText className={iconClass} />;
      case 'image': return <ImageIcon className={iconClass} />;
      case 'spreadsheet': return <Table className={iconClass} />;
      case 'audio': return <Music className={iconClass} />;
      case 'video': return <Video className={iconClass} />;
      case 'archive': return <Archive className={iconClass} />;
      default: return <File className={iconClass} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className="w-full max-w-3xl mx-auto rounded-3xl glass-card-elevated p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-lg relative overflow-hidden"
    >
      {/* Background accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${categoryInfo.color}`} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Icon and info */}
        <div className="flex items-center gap-4 min-w-0">
          {/* File Icon with gradient category badge */}
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr ${categoryInfo.color} flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20`}>
            {renderIcon()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${categoryInfo.badgeColor}`}>
                .{extension.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {categoryInfo.name}
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate mt-1" title={fileName}>
              {fileName}
            </h3>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" /> {sizeFormatted}
              </span>
              <span>•</span>
              <span className="truncate max-w-[200px] sm:max-w-xs">{file.type || 'Standard Format'}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={onReplace}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Choose a different file"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Change File</span>
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Remove file"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
