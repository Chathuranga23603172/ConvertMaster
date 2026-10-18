import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  HardDrive, 
  Lock, 
  Layers, 
  ChevronDown,
  CheckCircle2,
  FileCheck2,
  Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeaturesSection() {
  const [openFaq, setOpenFaq] = useState(null);

  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-indigo-500" />,
      title: "Bank-Grade Encryption",
      description: "All transfers are fortified with 256-bit TLS/SSL encryption. Your files are automatically deleted after 2 hours."
    },
    {
      icon: <Gauge className="w-6 h-6 text-purple-500" />,
      title: "Blazing Fast Transcoding",
      description: "Powered by modern multi-threaded WebAssembly & parallel cloud nodes for near-instant conversions."
    },
    {
      icon: <FileCheck2 className="w-6 h-6 text-emerald-500" />,
      title: "100% Quality Preservation",
      description: "Smart layout analysis maintains vector precision, tabular formulas, high-DPI images, and metadata integrity."
    },
    {
      icon: <Layers className="w-6 h-6 text-pink-500" />,
      title: "Batch & Multi-Format",
      description: "Convert dozens of files in bulk. Merge multiple image formats into single PDFs or split PDFs effortlessly."
    }
  ];

  const faqs = [
    {
      q: "Are my files private and secure?",
      a: "Yes, absolutely. We prioritize your privacy above all. Files are processed securely via ephemeral sandboxes and automatically deleted after 2 hours. We never read, inspect, or retain your data."
    },
    {
      q: "What is the maximum file size limit?",
      a: "ConvertMaster supports files up to 2GB per upload, significantly higher than typical 25MB or 100MB web limits. Batch processing also handles multiple large files simultaneously."
    },
    {
      q: "Does PDF to Word convert tables and formatting accurately?",
      a: "Yes. Our neural layout engine detects headings, tables, embedded fonts, and page columns, generating native editable Microsoft Word (.docx) documents with clean typography."
    },
    {
      q: "Do I need to install any software or plugins?",
      a: "No installation is required. ConvertMaster runs 100% inside any modern web browser across Windows, macOS, Linux, iOS, and Android."
    }
  ];

  return (
    <section className="mt-24 max-w-6xl mx-auto px-4 pb-12">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
          Why ConvertMaster
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white mt-3">
          Engineered for Speed, Quality & Total Privacy
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
          Everything you need to convert and optimize your documents without compromise.
        </p>
      </div>

      {/* 4 Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feat, idx) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            whileHover={{ y: -5 }}
            className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4 shadow-sm">
              {feat.icon}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
              {feat.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {feat.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="mt-20 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Got questions? We've got answers.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                className="rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-indigo-500' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
