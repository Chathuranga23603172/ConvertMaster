import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  Zap 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConvertAction({ 
  onConvert, 
  isConverting, 
  progress, 
  stageText, 
  onCancel, 
  selectedTarget,
  fileName 
}) {
  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      {!isConverting ? (
        // Standard Action Button State
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl glass-card border border-indigo-100 dark:border-indigo-900/40 shadow-lg"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Zap className="w-5 h-5 fill-indigo-500/20" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Ready to Convert
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transcoding to <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">.{selectedTarget}</span> with hardware acceleration
              </p>
            </div>
          </div>

          <motion.button
            id="convert-submit-btn"
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onConvert}
            className="w-full sm:w-auto relative group overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-extrabold text-base tracking-wide shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
          >
            {/* Shimmer light bar effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Convert File Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      ) : (
        // Active Converting State with Multi-stage Progress Bar
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl glass-card-elevated p-6 sm:p-8 border border-indigo-200 dark:border-indigo-800 shadow-2xl relative overflow-hidden"
        >
          {/* Top pulse line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />

          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Converting File...
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {progress}%
                  </span>
                </h4>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {stageText || 'Processing file stream...'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Cancel conversion"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar Container */}
          <div className="relative w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-sm"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut", duration: 0.2 }}
            />
          </div>

          {/* Stepper Dots / Stage Indicators */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs">
            <div className={`transition-colors font-medium ${progress >= 20 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}`}>
              1. Analyzing
            </div>
            <div className={`transition-colors font-medium ${progress >= 50 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}`}>
              2. Transcoding
            </div>
            <div className={`transition-colors font-medium ${progress >= 80 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}`}>
              3. Optimizing
            </div>
            <div className={`transition-colors font-medium ${progress >= 100 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}`}>
              4. Ready
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
