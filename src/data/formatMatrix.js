export const FILE_CATEGORIES = {
  document: {
    name: 'Documents',
    extensions: ['pdf', 'docx', 'doc', 'txt', 'rtf', 'odt', 'html', 'epub', 'md'],
    color: 'from-blue-500 to-indigo-600',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  image: {
    name: 'Images',
    extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'avif', 'ico'],
    color: 'from-purple-500 to-pink-600',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  spreadsheet: {
    name: 'Spreadsheets',
    extensions: ['xlsx', 'xls', 'csv', 'ods', 'json', 'xml'],
    color: 'from-emerald-500 to-teal-600',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  audio: {
    name: 'Audio',
    extensions: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'],
    color: 'from-amber-500 to-orange-600',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  video: {
    name: 'Video',
    extensions: ['mp4', 'webm', 'mkv', 'mov', 'avi'],
    color: 'from-rose-500 to-red-600',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  archive: {
    name: 'Archives',
    extensions: ['zip', 'tar', 'gz', '7z', 'rar'],
    color: 'from-cyan-500 to-blue-600',
    badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  }
};

// Target format recommendations based on source extension
export const CONVERSION_TARGETS = {
  pdf: ['docx', 'txt', 'epub', 'html', 'png', 'jpg'],
  docx: ['pdf', 'txt', 'rtf', 'odt', 'html', 'epub'],
  doc: ['docx', 'pdf', 'txt', 'rtf'],
  txt: ['pdf', 'docx', 'md', 'html', 'epub'],
  md: ['pdf', 'html', 'docx', 'txt'],
  rtf: ['pdf', 'docx', 'txt'],
  odt: ['pdf', 'docx', 'txt'],
  html: ['pdf', 'docx', 'txt', 'md'],
  epub: ['pdf', 'mobi', 'txt', 'docx'],

  png: ['jpg', 'webp', 'pdf', 'svg', 'avif', 'ico', 'gif'],
  jpg: ['png', 'webp', 'pdf', 'avif', 'bmp'],
  jpeg: ['png', 'webp', 'pdf', 'avif', 'bmp'],
  webp: ['png', 'jpg', 'pdf', 'gif'],
  svg: ['png', 'jpg', 'pdf', 'webp'],
  gif: ['mp4', 'webp', 'png', 'apng'],
  avif: ['png', 'jpg', 'webp'],
  bmp: ['png', 'jpg', 'webp', 'pdf'],

  xlsx: ['pdf', 'csv', 'ods', 'json', 'xml'],
  xls: ['xlsx', 'pdf', 'csv', 'json'],
  csv: ['xlsx', 'pdf', 'json', 'xml'],

  mp3: ['wav', 'aac', 'flac', 'ogg', 'm4a'],
  wav: ['mp3', 'aac', 'flac', 'ogg'],
  flac: ['mp3', 'wav', 'aac', 'm4a'],
  aac: ['mp3', 'wav', 'flac'],
  ogg: ['mp3', 'wav', 'flac'],
  m4a: ['mp3', 'wav', 'aac', 'flac'],

  mp4: ['mp3', 'webm', 'gif', 'avi', 'mov'],
  webm: ['mp4', 'mp3', 'gif'],
  mov: ['mp4', 'webm', 'mp3', 'gif'],
  mkv: ['mp4', 'mp3', 'avi'],
  avi: ['mp4', 'webm', 'mp3'],

  zip: ['tar.gz', '7z'],
  rar: ['zip', '7z'],
  '7z': ['zip', 'tar.gz'],
};

// Popular preset pairings for quick-click hero pills
export const POPULAR_PRESETS = [
  { from: 'PDF', to: 'Word', fromExt: 'pdf', toExt: 'docx', icon: 'FileText', label: 'PDF to Word' },
  { from: 'Word', to: 'PDF', fromExt: 'docx', toExt: 'pdf', icon: 'FileText', label: 'Word to PDF' },
  { from: 'JPG', to: 'PNG', fromExt: 'jpg', toExt: 'png', icon: 'Image', label: 'JPG to PNG' },
  { from: 'Excel', to: 'PDF', fromExt: 'xlsx', toExt: 'pdf', icon: 'Table', label: 'Excel to PDF' },
  { from: 'MP4', to: 'MP3', fromExt: 'mp4', toExt: 'mp3', icon: 'Music', label: 'MP4 to MP3' },
  { from: 'PNG', to: 'WebP', fromExt: 'png', toExt: 'webp', icon: 'Image', label: 'PNG to WebP' },
];

// Sample files for instant zero-effort testing
export const SAMPLE_FILES = [
  {
    name: 'Quarterly_Financial_Report_2026.pdf',
    size: 2450892,
    type: 'application/pdf',
    extension: 'pdf',
    category: 'document',
    contentPreview: 'Financial Overview Q3 2026: Revenue +34% YoY, Operating Margin 28.4%...',
  },
  {
    name: 'Modern_Product_Mockup.png',
    size: 1845200,
    type: 'image/png',
    extension: 'png',
    category: 'image',
    contentPreview: 'High-res 3000x2000 transparent alpha PNG graphic preview...',
  },
  {
    name: 'Sales_Performance_Q3.xlsx',
    size: 890400,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: 'xlsx',
    category: 'spreadsheet',
    contentPreview: 'Sheet 1: 540 rows, 18 columns, formulas for Gross Revenue & Tax...',
  },
  {
    name: 'Podcast_Episode_Interview.mp4',
    size: 8940000,
    type: 'video/mp4',
    extension: 'mp4',
    category: 'video',
    contentPreview: '1080p H.264 AAC Stereo audio stream (Duration: 04:15)...',
  }
];

export function getFileCategory(extension) {
  const ext = (extension || '').toLowerCase().replace('.', '');
  for (const [catKey, catData] of Object.entries(FILE_CATEGORIES)) {
    if (catData.extensions.includes(ext)) {
      return { categoryKey: catKey, ...catData };
    }
  }
  return {
    categoryKey: 'other',
    name: 'Other File',
    color: 'from-slate-500 to-gray-600',
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getAvailableTargets(ext) {
  const cleanExt = (ext || '').toLowerCase().replace('.', '');
  if (CONVERSION_TARGETS[cleanExt]) {
    return CONVERSION_TARGETS[cleanExt];
  }
  
  // Fallback targets by category
  const cat = getFileCategory(cleanExt).categoryKey;
  if (cat === 'document') return ['pdf', 'docx', 'txt', 'html'];
  if (cat === 'image') return ['png', 'jpg', 'webp', 'pdf'];
  if (cat === 'spreadsheet') return ['pdf', 'csv', 'xlsx', 'json'];
  if (cat === 'audio') return ['mp3', 'wav', 'flac'];
  if (cat === 'video') return ['mp4', 'webm', 'mp3'];
  return ['pdf', 'zip', 'txt'];
}
