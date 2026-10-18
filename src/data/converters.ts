export interface ConverterItem {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  category: 'audio-video' | 'images' | 'documents' | 'tools';
  categoryLabel: string;
  inputFormats: string[];
  outputFormats: string[];
  badge?: string;
  badgeType?: 'primary' | 'success' | 'warning' | 'purple';
  icon: string;
  gradient: string;
  status: 'active' | 'coming-soon';
  features: string[];
}

export const CONVERTERS: ConverterItem[] = [
  {
    id: 'mov-to-mp4',
    slug: 'mov-to-mp4',
    name: 'MOV to MP4 Converter',
    shortDescription: 'Convert Apple QuickTime MOV videos to universal, high-compatibility MP4 format directly in your browser.',
    fullDescription: 'Convert iPhone, iPad, and Mac MOV recordings to universal MP4 videos that play on every device. Trim clips, downscale resolution (1080p, 720p, 480p), adjust quality, or mute audio with 100% in-browser privacy.',
    category: 'audio-video',
    categoryLabel: 'Audio & Video',
    inputFormats: ['MOV', 'QT'],
    outputFormats: ['MP4'],
    badge: 'Popular',
    badgeType: 'primary',
    icon: 'Video',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    status: 'active',
    features: [
      'iPhone & QuickTime MOV support',
      'Lossless stream copy when compatible',
      'Resolution scaling (1080p, 720p)',
      '100% Client-side privacy'
    ]
  },
  {
    id: 'mp4-to-mp3',
    slug: 'mp4-to-mp3',
    name: 'MP4 to MP3 Converter',
    shortDescription: 'Extract crystal-clear MP3 audio from MP4, MOV, and WebM videos with custom bitrate and trimming.',
    fullDescription: 'Convert any video file to high-fidelity MP3 audio directly in your browser. Choose bitrates up to 320 kbps, trim unwanted sections, adjust volume, and edit ID3 tags with zero upload limits.',
    category: 'audio-video',
    categoryLabel: 'Audio & Video',
    inputFormats: ['MP4', 'MOV', 'WEBM', 'MKV', 'AVI'],
    outputFormats: ['MP3', 'WAV'],
    badge: 'Popular',
    badgeType: 'primary',
    icon: 'Music',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    status: 'active',
    features: [
      'Up to 320 kbps studio quality',
      'Audio trimming & volume boost',
      'ID3 tags metadata editor',
      '100% Client-side privacy'
    ]
  },
  {
    id: 'images-to-pdf',
    slug: 'images-to-pdf',
    name: 'Images to PDF Converter',
    shortDescription: 'Merge JPG, PNG, and WebP images into a single polished PDF with page reordering and custom margins.',
    fullDescription: 'Combine multiple photos and screenshots into a single clean PDF document. Reorder pages with ease, rotate individual images, choose page sizes (A4, Letter, Auto-fit), and customize margins.',
    category: 'documents',
    categoryLabel: 'Documents & PDF',
    inputFormats: ['JPG', 'PNG', 'WEBP', 'GIF', 'SVG'],
    outputFormats: ['PDF'],
    badge: 'Lossless',
    badgeType: 'success',
    icon: 'FileText',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    status: 'active',
    features: [
      'Drag-and-drop page reordering',
      'A4, Letter & Fit-to-image sizes',
      'Individual page rotation (90°)',
      'Adjustable quality & margins'
    ]
  },
  {
    id: 'image-converter',
    slug: 'image-converter',
    name: 'Universal Image Converter',
    shortDescription: 'Convert between WebP, PNG, JPG, and AVIF with compression quality and dimension scaling controls.',
    fullDescription: 'Switch between modern and traditional image formats in seconds. Compress images without quality loss, resize dimensions, and batch convert folders with instant local processing.',
    category: 'images',
    categoryLabel: 'Images',
    inputFormats: ['PNG', 'JPG', 'WEBP', 'AVIF', 'BMP'],
    outputFormats: ['PNG', 'JPG', 'WEBP'],
    badge: 'Lightning Fast',
    badgeType: 'purple',
    icon: 'Image',
    gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    status: 'active',
    features: [
      'Quality compression slider',
      'Dimension scaling (0.5x, 1x, 2x)',
      'Batch conversion support',
      'Zero server upload'
    ]
  },
  {
    id: 'svg-to-png',
    slug: 'svg-to-png',
    name: 'SVG to High-Res PNG',
    shortDescription: 'Rasterize vector SVGs into super crisp high-resolution PNGs up to 8x scale with transparent background.',
    fullDescription: 'Transform vector SVG graphics into ultra high-resolution PNG images. Choose custom scale factors up to 8x for print or Retina displays, and toggle between transparent or custom backgrounds.',
    category: 'images',
    categoryLabel: 'Images',
    inputFormats: ['SVG'],
    outputFormats: ['PNG'],
    badge: 'Vector',
    badgeType: 'primary',
    icon: 'Sparkles',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    status: 'active',
    features: [
      'Up to 8x high-res upscaling',
      'Transparent background support',
      'Instant vector rasterization',
      'No quality distortion'
    ]
  },
  {
    id: 'pdf-to-images',
    slug: 'pdf-to-images',
    name: 'PDF to Images (JPG / PNG)',
    shortDescription: 'Extract every page of your PDF file into crisp high-resolution JPG or PNG pictures.',
    fullDescription: 'Extract pages from PDF documents into separate image files with custom DPI resolution.',
    category: 'documents',
    categoryLabel: 'Documents & PDF',
    inputFormats: ['PDF'],
    outputFormats: ['PNG', 'JPG'],
    badge: 'In Roadmap',
    badgeType: 'warning',
    icon: 'FileImage',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    status: 'coming-soon',
    features: [
      'Page-by-page extraction',
      'Download all as ZIP',
      'Adjustable DPI resolution'
    ]
  },
  {
    id: 'wav-to-mp3',
    slug: 'wav-to-mp3',
    name: 'WAV to MP3 Converter',
    shortDescription: 'Compress large uncompressed WAV recordings into lightweight, studio-grade MP3 audio.',
    fullDescription: 'Compress large uncompressed audio files into portable MP3s with exact bitrate targeting.',
    category: 'audio-video',
    categoryLabel: 'Audio & Video',
    inputFormats: ['WAV', 'AIFF', 'OGG'],
    outputFormats: ['MP3'],
    badge: 'In Roadmap',
    badgeType: 'warning',
    icon: 'Volume2',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    status: 'coming-soon',
    features: [
      'Lossless-to-lossy compression',
      'Fast client-side encoding',
      'Stereo & Mono modes'
    ]
  }
];
