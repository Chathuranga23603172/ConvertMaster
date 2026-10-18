import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, FileStack, Sparkles } from 'lucide-react';

export default function DesktopTitleBar() {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
      setIsElectron(true);
      window.electronAPI.windowControls.isMaximized().then(setIsMaximized);
    }
  }, []);

  if (!isElectron) return null;

  const handleMinimize = () => {
    window.electronAPI.windowControls.minimize();
  };

  const handleMaximize = async () => {
    window.electronAPI.windowControls.maximize();
    const maximized = await window.electronAPI.windowControls.isMaximized();
    setIsMaximized(maximized);
  };

  const handleClose = () => {
    window.electronAPI.windowControls.close();
  };

  return (
    <div 
      className="h-10 select-none flex items-center justify-between px-3 bg-slate-900/90 dark:bg-slate-950/95 border-b border-slate-800 text-slate-300 z-50 fixed top-0 left-0 right-0 backdrop-blur-md"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* Left: Brand Icon & Title */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm">
          <FileStack className="w-3 h-3" />
        </div>
        <span className="text-xs font-bold tracking-wide text-slate-200">
          ConvertMaster <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Desktop</span>
        </span>
      </div>

      {/* Center: Subtle Title / Info */}
      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>Local Zero-Network Engine</span>
      </div>

      {/* Right: Window Controls */}
      <div 
        className="flex items-center space-x-1"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <button
          onClick={handleMinimize}
          className="w-8 h-7 flex items-center justify-center rounded hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleMaximize}
          className="w-8 h-7 flex items-center justify-center rounded hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-colors"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>

        <button
          onClick={handleClose}
          className="w-8 h-7 flex items-center justify-center rounded hover:bg-rose-600/90 text-slate-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
