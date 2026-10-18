'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  ArrowLeft,
  Settings,
  Sparkles,
  ShieldCheck,
  Check,
  RotateCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Eye,
  FileCheck2,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import DropZone from '@/components/DropZone';
import {
  ImageItem,
  PdfGenerationOptions,
  generatePdfFromImages,
} from '@/utils/pdfGenerator';
import styles from './images-to-pdf.module.css';

export default function ImagesToPdfPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'fit' | 'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [margin, setMargin] = useState<'none' | 'small' | 'normal' | 'large'>('small');
  const [fit, setFit] = useState<'contain' | 'cover'>('contain');
  const [quality, setQuality] = useState<'lossless' | 'high' | 'compact'>('high');
  const [pdfFilename, setPdfFilename] = useState<string>('converted-document.pdf');

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Handle image files drop/select
  const handleFilesSelected = (files: File[]) => {
    const validImageFiles = files.filter((f) => f.type.startsWith('image/'));

    const newItems: ImageItem[] = validImageFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file),
      rotation: 0,
    }));

    setImages((prev) => [...prev, ...newItems]);
    // Reset previous PDF result
    setPdfBlob(null);
    setPdfUrl(null);
  };

  // Reordering helpers
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setImages(copy);
    setPdfBlob(null);
    setPdfUrl(null);
  };

  // Rotate individual image 90 degrees clockwise
  const handleRotate = (index: number) => {
    const copy = [...images];
    copy[index].rotation = (copy[index].rotation + 90) % 360;
    setImages(copy);
    setPdfBlob(null);
    setPdfUrl(null);
  };

  // Remove individual image
  const handleRemove = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setPdfBlob(null);
    setPdfUrl(null);
  };

  // Clear all images
  const handleClearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setPdfBlob(null);
    setPdfUrl(null);
  };

  // Generate PDF
  const handleGeneratePdf = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    setProgress(5);
    setStatusMessage('Compiling images into PDF pages...');

    try {
      const options: PdfGenerationOptions = {
        pageSize,
        orientation,
        margin,
        fit,
        quality,
        onProgress: (p) => {
          setProgress(p);
        },
      };

      const blob = await generatePdfFromImages(images, options);
      const url = URL.createObjectURL(blob);
      setPdfBlob(blob);
      setPdfUrl(url);
      setProgress(100);
      setStatusMessage('PDF successfully created!');

      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch (err: unknown) {
      console.error(err);
      setStatusMessage(`Error: ${err instanceof Error ? err.message : 'PDF creation failed'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download PDF
  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = pdfFilename.endsWith('.pdf') ? pdfFilename : `${pdfFilename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const totalOriginalSize = images.reduce((acc, curr) => acc + curr.size, 0);

  return (
    <div className={styles.pageWrapper}>
      <div className="container">
        {/* Breadcrumb Navigation */}
        <div className={styles.breadcrumbBar}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>All Converters</span>
          </Link>
          <span className={styles.breadcrumbDivider}>/</span>
          <span className={styles.breadcrumbCurrent}>Images to PDF</span>
        </div>

        {/* Hero Title Header */}
        <div className={styles.headerHero}>
          <div className={styles.badgeRow}>
            <span className="badge badge-success">Document Merger</span>
            <span className="badge badge-primary">100% In-Browser</span>
            <span className="badge badge-purple">Zero Watermarks</span>
          </div>
          <h1 className={styles.pageTitle}>
            Convert <span className="text-gradient">Images to PDF</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Merge JPG, PNG, WebP, and SVG images into a clean PDF document. Reorder pages, rotate scans, configure page sizes (A4, Letter, Auto-Fit), and compress file size without server uploads.
          </p>
        </div>

        {/* Upload or Active Workspace */}
        {images.length === 0 ? (
          <div className={styles.uploadSection}>
            <DropZone
              onFilesSelected={handleFilesSelected}
              accept="image/*,.jpg,.jpeg,.png,.webp,.svg,.gif,.bmp"
              multiple={true}
              title="Drop images here to merge into PDF"
              description="or click to browse multiple photos from your device"
              supportedFormatsText="JPG, PNG, WEBP, SVG, GIF, BMP"
            />
          </div>
        ) : (
          <div className={styles.workspace}>
            {/* Left Column: Gallery & Page Management */}
            <div className={styles.leftCol}>
              <div className={`glass-panel ${styles.panel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleGroup}>
                    <Layers size={18} className={styles.iconAccent} />
                    <h3 className={styles.panelTitle}>
                      Pages ({images.length})
                    </h3>
                  </div>

                  <div className={styles.headerBtnGroup}>
                    <label className={`btn btn-secondary btn-sm ${styles.addMoreBtn}`}>
                      <Plus size={14} />
                      <span>Add Images</span>
                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.svg,.gif,.bmp"
                        multiple
                        className={styles.hiddenFileInput}
                        onChange={(e) => {
                          if (e.target.files) {
                            handleFilesSelected(Array.from(e.target.files));
                          }
                        }}
                      />
                    </label>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={handleClearAll}
                      title="Clear all pages"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Thumbnail Page Grid */}
                <div className={styles.pageGrid}>
                  {images.map((item, index) => (
                    <div key={item.id} className={styles.pageCard}>
                      <div className={styles.pageThumbnailBox}>
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className={styles.pageThumbImg}
                          style={{
                            transform: `rotate(${item.rotation}deg)`,
                          }}
                        />
                        <div className={styles.pageBadge}>Page {index + 1}</div>
                      </div>

                      <div className={styles.pageInfo}>
                        <span className={styles.pageName}>{item.name}</span>
                        <span className={styles.pageSize}>{formatBytes(item.size)}</span>
                      </div>

                      {/* Page Action Controls */}
                      <div className={styles.pageControls}>
                        <button
                          type="button"
                          className={styles.controlBtn}
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          title="Move earlier"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          className={styles.controlBtn}
                          disabled={index === images.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          title="Move later"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          className={styles.controlBtn}
                          onClick={() => handleRotate(index)}
                          title="Rotate 90°"
                        >
                          <RotateCw size={14} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.controlBtn} ${styles.controlBtnDanger}`}
                          onClick={() => handleRemove(item.id)}
                          title="Delete page"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Card */}
              {isGenerating && (
                <div className={`glass-panel ${styles.progressCard}`}>
                  <div className={styles.progressHeader}>
                    <span>{statusMessage}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: PDF Settings & Output */}
            <div className={styles.rightCol}>
              <div className={`glass-panel ${styles.panel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleGroup}>
                    <Settings size={18} className={styles.iconAccent} />
                    <h3 className={styles.panelTitle}>Document Layout</h3>
                  </div>
                  <span className="badge badge-success">PDF Ready</span>
                </div>

                <div className={styles.settingsGrid}>
                  {/* Page Size */}
                  <div className={styles.settingField}>
                    <label className={styles.fieldLabel}>Page Size</label>
                    <div className={styles.toggleGroup3}>
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${pageSize === 'a4' ? styles.toggleBtnActive : ''}`}
                        onClick={() => { setPageSize('a4'); setPdfBlob(null); }}
                      >
                        A4 Standard
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${pageSize === 'letter' ? styles.toggleBtnActive : ''}`}
                        onClick={() => { setPageSize('letter'); setPdfBlob(null); }}
                      >
                        US Letter
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${pageSize === 'fit' ? styles.toggleBtnActive : ''}`}
                        onClick={() => { setPageSize('fit'); setPdfBlob(null); }}
                      >
                        Fit to Image
                      </button>
                    </div>
                  </div>

                  {/* Orientation & Margins */}
                  <div className={styles.settingRow2}>
                    <div className={styles.settingField}>
                      <label className={styles.fieldLabel}>Orientation</label>
                      <select
                        value={orientation}
                        onChange={(e) => {
                          setOrientation(e.target.value as 'auto' | 'portrait' | 'landscape');
                          setPdfBlob(null);
                        }}
                        className={styles.selectInput}
                        disabled={pageSize === 'fit'}
                      >
                        <option value="auto">Auto (Match Image)</option>
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>

                    <div className={styles.settingField}>
                      <label className={styles.fieldLabel}>Page Margins</label>
                      <select
                        value={margin}
                        onChange={(e) => {
                          setMargin(e.target.value as 'none' | 'small' | 'normal' | 'large');
                          setPdfBlob(null);
                        }}
                        className={styles.selectInput}
                      >
                        <option value="none">None (0 mm)</option>
                        <option value="small">Small (7 mm)</option>
                        <option value="normal">Normal (14 mm)</option>
                        <option value="large">Large (21 mm)</option>
                      </select>
                    </div>
                  </div>

                  {/* Image Fit & Quality */}
                  <div className={styles.settingRow2}>
                    <div className={styles.settingField}>
                      <label className={styles.fieldLabel}>Image Scaling</label>
                      <select
                        value={fit}
                        onChange={(e) => {
                          setFit(e.target.value as 'contain' | 'cover');
                          setPdfBlob(null);
                        }}
                        className={styles.selectInput}
                      >
                        <option value="contain">Contain (No Crop)</option>
                        <option value="cover">Cover (Fill Page)</option>
                      </select>
                    </div>

                    <div className={styles.settingField}>
                      <label className={styles.fieldLabel}>Quality / Compression</label>
                      <select
                        value={quality}
                        onChange={(e) => {
                          setQuality(e.target.value as 'lossless' | 'high' | 'compact');
                          setPdfBlob(null);
                        }}
                        className={styles.selectInput}
                      >
                        <option value="high">High (Balanced)</option>
                        <option value="lossless">Lossless (Original)</option>
                        <option value="compact">Compact (Small Size)</option>
                      </select>
                    </div>
                  </div>

                  {/* Filename */}
                  <div className={styles.settingField}>
                    <label className={styles.fieldLabel}>Output Filename</label>
                    <input
                      type="text"
                      value={pdfFilename}
                      onChange={(e) => setPdfFilename(e.target.value)}
                      className={styles.textInput}
                    />
                  </div>

                  {/* Generate Button */}
                  <div className={styles.actionSection}>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleGeneratePdf}
                      disabled={isGenerating}
                      style={{ width: '100%' }}
                    >
                      <Sparkles size={18} />
                      <span>
                        {isGenerating
                          ? 'Generating PDF Locally...'
                          : pdfBlob
                          ? 'Regenerate PDF'
                          : `Compile ${images.length} ${images.length === 1 ? 'Page' : 'Pages'} to PDF`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* PDF Result Box */}
              {pdfBlob && pdfUrl && (
                <div className={`glass-panel ${styles.resultCard}`}>
                  <div className={styles.resultHeader}>
                    <div className={styles.resultTitleGroup}>
                      <div className={styles.resultCheckCircle}>
                        <Check size={22} />
                      </div>
                      <div>
                        <h4 className={styles.resultTitle}>PDF Successfully Created!</h4>
                        <p className={styles.resultStats}>
                          {images.length} {images.length === 1 ? 'Page' : 'Pages'} • PDF Size:{' '}
                          <span className={styles.highlightText}>
                            {formatBytes(pdfBlob.size)}
                          </span>{' '}
                          (Raw Images: {formatBytes(totalOriginalSize)})
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.resultActionButtons}>
                    <button
                      className="btn btn-primary"
                      onClick={handleDownloadPdf}
                      style={{ flex: 1 }}
                    >
                      <Download size={18} />
                      <span>Download PDF</span>
                    </button>
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      <Eye size={16} />
                      <span>Preview in Tab</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Benefits Grid */}
        <div className={styles.infoSection}>
          <div className={styles.infoGrid}>
            <div className={`glass-panel ${styles.infoCard}`}>
              <ShieldCheck size={28} className={styles.infoIcon} />
              <h4>Confidential &amp; Private</h4>
              <p>
                Legal contracts, medical receipts, invoices, and family photos never leave your device. The PDF is assembled right inside your browser memory using PDF-lib.
              </p>
            </div>
            <div className={`glass-panel ${styles.infoCard}`}>
              <FileCheck2 size={28} className={styles.infoIcon} />
              <h4>No Page Limits</h4>
              <p>
                Online converter services charge hefty subscriptions if you merge more than 5 or 10 images. With OmniConvert, combine 50+ photos into a single PDF without limits.
              </p>
            </div>
            <div className={`glass-panel ${styles.infoCard}`}>
              <Sparkles size={28} className={styles.infoIcon} />
              <h4>Pixel-Perfect Vector Margins</h4>
              <p>
                Choose standard A4 or US Letter formats, or select Auto-Fit to preserve original image resolutions with zero downsampling or unwanted borders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
