import React, { useState } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Sliders, 
  Check, 
  ChevronDown, 
  FileText, 
  Image as ImageIcon, 
  Table, 
  Music, 
  Video, 
  Settings2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvailableTargets, FILE_CATEGORIES } from '../data/formatMatrix';

export default function FormatSelector({ 
  sourceExtension, 
  selectedTarget, 
  onSelectTarget,
  conversionQuality,
  setConversionQuality 
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  const targets = getAvailableTargets(sourceExtension);

  // Group all potential formats for the dropdown/expanded view
  const allCategoryKeys = Object.keys(FILE_CATEGORIES);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-3xl mx-auto mt-6 rounded-3xl glass-card-elevated p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-xl"
    >
      {/* Header section with conversion directional indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-6 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Step 2 of 3
          </span>
          <h3 className="text-lg sm:text-xl font-bold font-heading text-slate-900 dark:text-white mt-0.5">
            Select Output Format
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Choose your desired target format and conversion fidelity.
          </p>
        </div>

        {/* Visual From -> To Badge */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase px-2 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            .{sourceExtension?.toUpperCase() || 'SRC'}
          </span>
          <ArrowRight className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase px-2 py-1 bg-indigo-50 dark:bg-indigo-950/80 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm">
            .{selectedTarget?.toUpperCase() || 'SELECT'}
          </span>
        </div>
      </div>

      {/* Target Format Chips (Recommended) */}
      <div className="mt-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Recommended Target Formats:
        </label>
        
        <div className="flex flex-wrap gap-2.5">
          {targets.map((fmt) => {
            const isSelected = selectedTarget?.toLowerCase() === fmt.toLowerCase();
            return (
              <motion.button
                key={fmt}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelectTarget(fmt)}
                className={`relative px-4 py-2.5 rounded-2xl text-sm font-bold uppercase tracking-wide transition-all duration-200 flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-sm'
                }`}
              >
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center w-4 h-4 rounded-full bg-white/20"
                  >
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </motion.span>
                )}
                <span>.{fmt}</span>
              </motion.button>
            );
          })}

          {/* More Formats Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
            >
              <span>More Formats</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Expanded Formats Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 sm:left-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-30 backdrop-blur-2xl"
                >
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                    All Available Formats
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto p-1">
                    {['pdf', 'docx', 'txt', 'rtf', 'html', 'epub', 'md', 'png', 'jpg', 'webp', 'svg', 'gif', 'xlsx', 'csv', 'json', 'mp3', 'wav', 'mp4', 'webm', 'zip', '7z'].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => {
                          onSelectTarget(fmt);
                          setDropdownOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase text-center transition-all ${
                          selectedTarget === fmt
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        .{fmt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Conversion Quality & Advanced Settings Toggle */}
      <div className="mt-7 pt-5 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Output Quality & Compression
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Settings2 className="w-3.5 h-3.5" />
            {showAdvanced ? 'Hide Advanced Options' : 'Advanced Options'}
          </button>
        </div>

        {/* Quality Selector Pills */}
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { id: 'high', label: 'Maximum Quality', desc: '100% Lossless', badge: 'HD' },
            { id: 'balanced', label: 'Balanced (Standard)', desc: 'Best Ratio', badge: 'Default' },
            { id: 'compact', label: 'Small File Size', desc: 'Compressed', badge: 'Mini' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setConversionQuality(item.id)}
              className={`p-3 rounded-2xl text-left border transition-all duration-200 ${
                conversionQuality === item.id
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${
                  conversionQuality === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {item.label}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {item.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {item.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Advanced Options Drawer */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Preserve Metadata & Exif</span>
                  <p className="text-slate-500">Retain creation dates, color profiles, and camera data</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">OCR Text Recognition</span>
                  <p className="text-slate-500">Extract readable text from scanned images and PDFs</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Auto-Sharpen Graphics</span>
                  <p className="text-slate-500">Apply subpixel rendering optimization during rasterization</p>
                </div>
                <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
