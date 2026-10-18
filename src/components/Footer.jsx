import React from 'react';
import { FileStack, Heart, Shield, Globe, Code2, Sparkles, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer({ onOpenFormats }) {
  return (
    <footer className="mt-20 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
                <FileStack className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold font-heading text-slate-900 dark:text-white">
                ConvertMaster
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              The modern, privacy-first universal file conversion workspace. Seamlessly convert documents, images, audio, video, and spreadsheets in seconds.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> ISO/IEC 27001 Compliant Sandboxing
              </span>
            </div>
          </div>

          {/* Popular Formats */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Popular Conversions
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button onClick={onOpenFormats} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  PDF to Word (DOCX)
                </button>
              </li>
              <li>
                <button onClick={onOpenFormats} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Word (DOCX) to PDF
                </button>
              </li>
              <li>
                <button onClick={onOpenFormats} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  JPG / PNG to WebP
                </button>
              </li>
              <li>
                <button onClick={onOpenFormats} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Excel (XLSX) to PDF
                </button>
              </li>
              <li>
                <button onClick={onOpenFormats} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  MP4 to MP3 Audio
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button onClick={onOpenFormats} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Supported Formats Directory
                </button>
              </li>
              <li>
                <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Security Architecture
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  FAQ & Knowledge Base
                </a>
              </li>
              <li>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  All Systems Operational
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {CURRENT_YEAR} ConvertMaster. Built with precision and care.</p>
          <div className="flex items-center gap-1">
            <span>Powered by Client-Side WebAssembly & Cloud Transcoder</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
