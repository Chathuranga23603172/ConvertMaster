import React from 'react';
import { 
  X, 
  Trash2, 
  History, 
  Download, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  FileText 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatFileSize } from '../data/formatMatrix';

import { downloadFile } from '../utils/fileDownloader';

export default function HistoryDrawer({ 
  isOpen, 
  onClose, 
  history = [], 
  onClearHistory 
}) {
  if (!isOpen) return null;

  const handleDownloadItem = (item) => {
    downloadFile(item.fileBlob, item.name, item.targetExt);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Conversion History
                  </h3>
                  <p className="text-xs text-slate-400">
                    {history.length} {history.length === 1 ? 'file' : 'files'} converted in this session
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Clock className="w-12 h-12 stroke-1 mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">
                    No conversions yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Upload and convert any file to see your activity logged here for instant re-download.
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {item.sourceExt}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300">
                          {item.targetExt}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {item.time}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatFileSize(item.size)} • {item.compressionSavings || 'Optimized'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownloadItem(item)}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 hover:text-indigo-600 border border-slate-200 dark:border-slate-600 transition-all shadow-sm shrink-0"
                      title="Download again"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Clear All */}
            {history.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                <button
                  onClick={onClearHistory}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1.5 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All History
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
