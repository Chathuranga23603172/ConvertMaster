import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Sparkles, 
  FileStack, 
  History, 
  Menu, 
  X, 
  ShieldCheck, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ 
  darkMode, 
  setDarkMode, 
  activeTab, 
  setActiveTab, 
  historyCount = 0, 
  onOpenHistory,
  onOpenFormatsModal 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('single')}>
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 group-hover:scale-105 transition-all duration-300">
                <FileStack className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight font-heading bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">
                  ConvertMaster
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-400/20 dark:to-purple-400/20 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200/50 dark:border-indigo-700/50">
                  Ultra
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5 hidden sm:block">
                Universal Intelligent File Engine
              </span>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <button
              id="nav-tab-single"
              onClick={() => setActiveTab('single')}
              className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'single'
                  ? 'text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {activeTab === 'single' && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700/50"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Single Convert
              </span>
            </button>

            <button
              id="nav-tab-batch"
              onClick={() => setActiveTab('batch')}
              className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'batch'
                  ? 'text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {activeTab === 'batch' && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700/50"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                Batch Mode
                <span className="ml-1 text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.2 rounded-full">
                  Multi
                </span>
              </span>
            </button>

            <button
              id="nav-tab-formats"
              onClick={onOpenFormatsModal}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-200"
            >
              Supported Formats
            </button>
          </nav>

          {/* Right Controls: History, Theme Toggle, CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* History Drawer Trigger */}
            <button
              id="history-btn"
              onClick={onOpenHistory}
              title="Recent Conversions"
              className="relative p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 flex items-center gap-1.5"
            >
              <History className="w-5 h-5" />
              {historyCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full animate-pulse">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Dark / Light Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
              aria-label="Toggle Theme"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-400 transition-transform rotate-0 duration-300" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600 transition-transform -rotate-12 duration-300" />
              )}
            </button>

            {/* Security Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>256-bit Encrypted</span>
            </div>

            {/* Mobile Menu Button */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-2 shadow-2xl"
          >
            <button
              onClick={() => { setActiveTab('single'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-left ${
                activeTab === 'single'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Single Convert</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => { setActiveTab('batch'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-left ${
                activeTab === 'batch'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Batch Mode</span>
              </div>
              <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-full">
                Multi
              </span>
            </button>

            <button
              onClick={() => { onOpenFormatsModal(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <span>Supported Formats (100+)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
