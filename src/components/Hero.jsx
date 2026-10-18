import React from 'react';
import { 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  Table, 
  Music, 
  Zap, 
  ShieldCheck, 
  Flame 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { POPULAR_PRESETS } from '../data/formatMatrix';

export default function Hero({ onSelectPreset }) {
  const getPresetIcon = (iconName) => {
    switch(iconName) {
      case 'FileText': return <FileText className="w-3.5 h-3.5" />;
      case 'Image': return <ImageIcon className="w-3.5 h-3.5" />;
      case 'Table': return <Table className="w-3.5 h-3.5" />;
      case 'Music': return <Music className="w-3.5 h-3.5" />;
      default: return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <section className="relative pt-10 pb-8 sm:pt-14 sm:pb-12 text-center max-w-4xl mx-auto px-4">
      {/* Decorative background glow spot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Pill Badge */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm backdrop-blur-md mb-6"
      >
        <span className="flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
        <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-300 bg-clip-text text-transparent flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          Blazing Fast Client-Side & Cloud Conversion Engine
        </span>
      </motion.div>

      {/* Main Heading */}
      <motion.h1 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-heading text-slate-900 dark:text-white leading-[1.12]"
      >
        Convert Any File,{' '}
        <span className="relative whitespace-nowrap">
          <span className="relative z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Instantly.
          </span>
          <span className="absolute bottom-1 left-0 w-full h-3 bg-indigo-500/15 dark:bg-indigo-500/30 rounded-full -rotate-1 -z-0" />
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-5 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed"
      >
        Transform documents, high-res images, spreadsheets, and multimedia files with pixel-perfect fidelity. Zero installation, 100% private, and completely free.
      </motion.p>

      {/* Quick Popular Presets Chips */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
          <Flame className="w-3.5 h-3.5 text-amber-500" /> Popular:
        </span>
        {POPULAR_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onSelectPreset(preset)}
            className="group flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">
              {getPresetIcon(preset.icon)}
            </span>
            <span>{preset.label}</span>
          </button>
        ))}
      </motion.div>
    </section>
  );
}
