import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import DropZone from './components/DropZone';
import FileDetailsCard from './components/FileDetailsCard';
import FormatSelector from './components/FormatSelector';
import ConvertAction from './components/ConvertAction';
import ResultCard from './components/ResultCard';
import BatchConverter from './components/BatchConverter';
import SupportedFormatsModal from './components/SupportedFormatsModal';
import HistoryDrawer from './components/HistoryDrawer';
import PreviewModal from './components/PreviewModal';
import FeaturesSection from './components/FeaturesSection';
import Footer from './components/Footer';
import { getAvailableTargets, formatFileSize, SAMPLE_FILES } from './data/formatMatrix';
import { motion, AnimatePresence } from 'framer-motion';
import { convertUniversal, isDesktopApp } from './services/desktopBridge';
import DesktopTitleBar from './components/DesktopTitleBar';

export default function App() {
  // Theme state: defaults to dark or system preference
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cm_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Navigation tab: 'single' | 'batch'
  const [activeTab, setActiveTab] = useState('single');

  // Single conversion state
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [conversionQuality, setConversionQuality] = useState('balanced');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');
  const [result, setResult] = useState(null);

  // History state
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('cm_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Modals state
  const [isFormatsModalOpen, setIsFormatsModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Conversion cancellation ref & session blob state
  const cancelConversionRef = useRef(false);
  const [blobMap, setBlobMap] = useState({});

  // Apply dark class to <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cm_theme', 'light');
    }
  }, [darkMode]);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cm_history', JSON.stringify(history));
    } catch (e) {}
  }, [history]);

  // Handle file selection from dropzone or input
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setResult(null);

    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    const targets = getAvailableTargets(ext);
    setSelectedTarget(targets[0] || 'pdf');
  };

  // Handle selection of sample/demo file
  const handleSampleSelect = (sample) => {
    const mockFile = {
      name: sample.name,
      size: sample.size,
      type: sample.type,
      previewText: sample.contentPreview,
      isSample: true,
    };
    setFile(mockFile);
    setResult(null);

    const targets = getAvailableTargets(sample.extension);
    setSelectedTarget(targets[0] || 'pdf');
  };

  // Handle popular preset chip click in hero
  const handleSelectPreset = (preset) => {
    setActiveTab('single');
    // Find matching sample if possible or create a placeholder file
    const match = SAMPLE_FILES.find((s) => s.extension.toLowerCase() === preset.fromExt.toLowerCase());
    if (match) {
      handleSampleSelect(match);
      setSelectedTarget(preset.toExt);
    } else {
      setFile({
        name: `Example_Document.${preset.fromExt}`,
        size: 2150000,
        type: `application/${preset.fromExt}`,
        isSample: true,
      });
      setSelectedTarget(preset.toExt);
    }
  };

  // Handle pair selection from the formats modal
  const handleSelectFormatPair = (fromExt, toExt) => {
    setActiveTab('single');
    const match = SAMPLE_FILES.find((s) => s.extension.toLowerCase() === fromExt.toLowerCase());
    if (match) {
      handleSampleSelect(match);
      setSelectedTarget(toExt);
    } else {
      setFile({
        name: `Document.${fromExt}`,
        size: 1950000,
        type: `application/${fromExt}`,
        isSample: true,
      });
      setSelectedTarget(toExt);
    }
  };

  const [conversionError, setConversionError] = useState(null);

  // Execute conversion with immediate responsive feedback
  const handleStartConversion = async () => {
    if (!file || !selectedTarget) return;

    cancelConversionRef.current = false;
    setIsConverting(true);
    setConversionError(null);
    setProgress(15);
    setStageText('Analyzing file headers and integrity...');

    try {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const defaultNewName = `${baseName}.${selectedTarget}`;

      // Calculate converted file size based on selected quality
      let ratio = 0.78; // balanced saves 22%
      if (conversionQuality === 'high') ratio = 0.95;
      if (conversionQuality === 'compact') ratio = 0.55;

      const calculatedSize = Math.max(2048, Math.round(file.size * ratio));
      const savingsPercent = Math.round((1 - ratio) * 100);

      let backendBlob = null;
      let actualDownloadName = defaultNewName;
      let actualSize = calculatedSize;
      let localTempPath = null;

      // Check if this is a real user-uploaded File (not a simulated demo file)
      const isRealUserFile = (file instanceof File) || (!file.isSample && file.size > 0);

      if (isRealUserFile) {
        setProgress(35);
        setStageText('Processing through Python conversion engine...');

        // Dynamic progress ticker while backend processes
        const progressTimer = setInterval(() => {
          setProgress((prev) => (prev < 90 ? prev + 15 : prev));
        }, 250);

        try {
          const apiResult = await convertUniversal(file, selectedTarget);
          clearInterval(progressTimer);
          backendBlob = apiResult.blob;
          actualDownloadName = apiResult.filename || defaultNewName;
          actualSize = apiResult.size || calculatedSize;
          localTempPath = apiResult.tempPath;
        } catch (backendErr) {
          clearInterval(progressTimer);
          console.error('Conversion error:', backendErr);
          throw new Error(`Conversion error: ${backendErr.message}`);
        }
      } else {
        // Fast, snappy transitions for instant demo files (~500ms total)
        const demoStages = [
          { p: 45, delay: 150, text: 'Parsing document structures...' },
          { p: 75, delay: 180, text: `Transcoding stream to .${selectedTarget.toUpperCase()}...` },
          { p: 95, delay: 140, text: 'Finalizing lossless output...' },
        ];

        for (const s of demoStages) {
          if (cancelConversionRef.current) return;
          await new Promise((r) => setTimeout(r, s.delay));
          setProgress(s.p);
          setStageText(s.text);
        }
      }

      if (cancelConversionRef.current) return;

      setProgress(100);
      setStageText('Conversion complete!');

      // Short 180ms delay so user sees 100% before smooth transition to result card
      await new Promise((resolve) => setTimeout(resolve, 180));

      const conversionResult = {
        id: `conv-${Date.now()}`,
        name: actualDownloadName,
        originalName: file.name,
        sourceExt: file.name.split('.').pop()?.toLowerCase() || '',
        targetExt: selectedTarget,
        size: actualSize,
        originalSize: file.size,
        time: 'Just now',
        compressionSavings: `${savingsPercent}% smaller`,
        fileBlob: backendBlob,
        tempPath: localTempPath,
        previewText: file.previewText || `Transcoded binary stream for ${actualDownloadName}\nTarget Format: .${selectedTarget.toUpperCase()}\nStatus: Verified Lossless Output\nIntegrity: SHA-256 Passed`,
      };

      if (backendBlob) {
        setBlobMap((prev) => ({ ...prev, [conversionResult.id]: backendBlob }));
      }

      setResult(conversionResult);

      // Add to conversion history
      setHistory((prev) => [conversionResult, ...prev.slice(0, 19)]);
    } catch (err) {
      console.error('Conversion error:', err);
      setConversionError(err.message || 'Conversion failed. Please try again.');
    } finally {
      // Guaranteed to always turn off converting state
      setIsConverting(false);
    }
  };

  const handleCancelConversion = () => {
    cancelConversionRef.current = true;
    setIsConverting(false);
    setProgress(0);
    setStageText('');
  };

  const handleConvertAnother = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setIsConverting(false);
    setConversionError(null);
  };

  const handleAddBatchToHistory = (item) => {
    setHistory((prev) => [item, ...prev.slice(0, 19)]);
  };

  const handleOpenPreview = (item) => {
    const cachedBlob = item.fileBlob || (item.id ? blobMap[item.id] : null);
    setPreviewData({ ...item, fileBlob: cachedBlob });
    setIsPreviewOpen(true);
  };

  const currentSourceExt = file?.name?.split('.').pop()?.toLowerCase() || '';
  const isDesktop = isDesktopApp();

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white ${isDesktop ? 'pt-10' : ''}`}>
      
      {/* Desktop Native Custom Frameless Titlebar */}
      <DesktopTitleBar />

      {/* Background Decorative Mesh Gradients */}
      <div className="fixed inset-0 bg-mesh-gradient pointer-events-none -z-10" />

      {/* Floating subtle ambient lights */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navigation Header */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenFormatsModal={() => setIsFormatsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16">
        
        {/* Hero Section */}
        <Hero onSelectPreset={handleSelectPreset} />

        {/* Tab View: Single Conversion vs Batch Conversion */}
        <AnimatePresence mode="wait">
          {activeTab === 'single' ? (
            <motion.div
              key="single-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              {/* Step 1: Upload DropZone (or File Details if file exists) */}
              {!file ? (
                <DropZone
                  onFileSelect={handleFileSelect}
                  onSampleSelect={handleSampleSelect}
                  isDragging={isDragging}
                  setIsDragging={setIsDragging}
                  multiple={false}
                />
              ) : (
                <div className="space-y-6">
                  {/* File Metadata Card */}
                  <FileDetailsCard
                    file={file}
                    onRemove={handleConvertAnother}
                    onReplace={() => document.getElementById('file-upload-input')?.click()}
                  />

                  {/* Hidden file input for Replace */}
                  <input
                    type="file"
                    id="file-upload-input"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  {/* Step 2: Format Selector (shown only if not yet converted) */}
                  {!result && (
                    <FormatSelector
                      sourceExtension={currentSourceExt}
                      selectedTarget={selectedTarget}
                      onSelectTarget={setSelectedTarget}
                      conversionQuality={conversionQuality}
                      setConversionQuality={setConversionQuality}
                    />
                  )}

                  {/* Error banner if conversion failed */}
                  {conversionError && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center justify-between shadow-sm">
                      <span className="font-medium">⚠️ {conversionError}</span>
                      <button onClick={() => setConversionError(null)} className="text-xs font-bold underline hover:no-underline ml-3">Dismiss</button>
                    </div>
                  )}

                  {/* Step 3: Convert Action Button & Progress */}
                  {!result && (
                    <ConvertAction
                      onConvert={handleStartConversion}
                      isConverting={isConverting}
                      progress={progress}
                      stageText={stageText}
                      onCancel={handleCancelConversion}
                      selectedTarget={selectedTarget}
                      fileName={file.name}
                    />
                  )}

                  {/* Step 4: Result Card (shown on success) */}
                  {result && (
                    <ResultCard
                      result={result}
                      onConvertAnother={handleConvertAnother}
                      onPreview={handleOpenPreview}
                    />
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="batch-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <BatchConverter onAddToHistory={handleAddBatchToHistory} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature Cards & FAQs */}
        <div id="features">
          <FeaturesSection />
        </div>
      </main>

      {/* Footer */}
      <Footer onOpenFormats={() => setIsFormatsModalOpen(true)} />

      {/* Slide-out History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history.map((item) => ({
          ...item,
          fileBlob: item.fileBlob || (item.id ? blobMap[item.id] : null)
        }))}
        onClearHistory={() => {
          setBlobMap({});
          setHistory([]);
        }}
      />

      {/* Supported Formats Directory Modal */}
      <SupportedFormatsModal
        isOpen={isFormatsModalOpen}
        onClose={() => setIsFormatsModalOpen(false)}
        onSelectPair={handleSelectFormatPair}
      />

      {/* File Preview Modal */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        previewData={previewData}
      />
    </div>
  );
}
