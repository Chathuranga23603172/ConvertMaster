import React, { useState } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Table, 
  Music, 
  Video, 
  Archive, 
  ArrowRight, 
  Sparkles, 
  Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FILE_CATEGORIES, CONVERSION_TARGETS } from '../data/formatMatrix';

export default function SupportedFormatsModal({ isOpen, onClose, onSelectPair }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  if (!isOpen) return null;

  const categoryEntries = Object.entries(FILE_CATEGORIES);

  // Filter conversions
  const conversionPairs = Object.entries(CONVERSION_TARGETS).flatMap(([from, toList]) =>
    toList.map((to) => ({ from, to }))
  );

  const filteredPairs = conversionPairs.filter((pair) => {
    const matchesSearch =
      pair.from.toLowerCase().includes(search.toLowerCase()) ||
      pair.to.toLowerCase().includes(search.toLowerCase());
    
    if (activeCategory === 'all') return matchesSearch;
    const catExtensions = FILE_CATEGORIES[activeCategory]?.extensions || [];
    return matchesSearch && catExtensions.includes(pair.from.toLowerCase());
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Supported Conversion Matrix
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Over 100+ document, multimedia, and data format conversions supported.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="p-6 pb-3 border-b border-slate-200 dark:border-slate-800 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search formats (e.g., pdf, word, png, mp3)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Formats
              </button>
              {categoryEntries.map(([catKey, catData]) => (
                <button
                  key={catKey}
                  onClick={() => setActiveCategory(catKey)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === catKey
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {catData.name}
                </button>
              ))}
            </div>
          </div>

          {/* Formats Grid */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filteredPairs.slice(0, 48).map((pair, idx) => (
              <button
                key={`${pair.from}-${pair.to}-${idx}`}
                onClick={() => {
                  onSelectPair?.(pair.from, pair.to);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-slate-800 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                  <span>.{pair.from}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-indigo-600 dark:text-indigo-400">.{pair.to}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans group-hover:text-indigo-500 transition-colors">
                  Convert
                </span>
              </button>
            ))}
          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {Math.min(filteredPairs.length, 48)} of {filteredPairs.length} conversion routes</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl font-semibold bg-indigo-600 text-white text-xs hover:bg-indigo-500 transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
