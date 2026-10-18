'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  Download,
  ArrowLeft,
  Settings,
  Sparkles,
  ShieldCheck,
  Check,
  FolderArchive,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import DropZone from '@/components/DropZone';
import styles from './image-converter.module.css';

interface ImageFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  previewUrl: string;
  targetFormat: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number;
  scale: number;
  resultBlob?: Blob;
  resultUrl?: string;
  resultSize?: number;
  status: 'idle' | 'converting' | 'done';
}

export default function ImageConverterPage() {
  const [items, setItems] = useState<ImageFileItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [quality, setQuality] = useState<number>(0.9);
  const [scale, setScale] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFilesSelected = (files: File[]) => {
    const validFiles = files.filter((f) => f.type.startsWith('image/'));
    const newItems: ImageFileItem[] = validFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file),
      targetFormat,
      quality,
      scale,
      status: 'idle',
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const convertSingle = (item: ImageFileItem): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const width = Math.round(img.naturalWidth * scale);
        const height = Math.round(img.naturalHeight * scale);
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Fill background white if converting PNG to JPG
        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Conversion failed'));
              return;
            }
            item.resultBlob = blob;
            item.resultUrl = URL.createObjectURL(blob);
            item.resultSize = blob.size;
            item.status = 'done';
            resolve();
          },
          targetFormat,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = item.previewUrl;
    });
  };

  const handleConvertAll = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    try {
      for (const item of items) {
        item.status = 'converting';
        setItems([...items]);
        await convertSingle(item);
      }
      setItems([...items]);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getExtension = (mime: string) => {
    if (mime === 'image/jpeg') return 'jpg';
    if (mime === 'image/png') return 'png';
    return 'webp';
  };

  const handleDownloadSingle = (item: ImageFileItem) => {
    if (!item.resultUrl) return;
    const base = item.name.replace(/\.[^/.]+$/, '');
    const ext = getExtension(targetFormat);
    const a = document.createElement('a');
    a.href = item.resultUrl;
    a.download = `${base}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllZip = async () => {
    const doneItems = items.filter((it) => it.resultBlob);
    if (doneItems.length === 0) return;

    const zip = new JSZip();
    const ext = getExtension(targetFormat);

    doneItems.forEach((item) => {
      const base = item.name.replace(/\.[^/.]+$/, '');
      zip.file(`${base}.${ext}`, item.resultBlob!);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni-converted-images-${Date.now()}.zip`;
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

  const hasDone = items.some((it) => it.status === 'done');

  return (
    <div className={styles.pageWrapper}>
      <div className="container">
        <div className={styles.breadcrumbBar}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>All Converters</span>
          </Link>
          <span className={styles.breadcrumbDivider}>/</span>
          <span className={styles.breadcrumbCurrent}>Universal Image Converter</span>
        </div>

        <div className={styles.headerHero}>
          <div className={styles.badgeRow}>
            <span className="badge badge-purple">High Efficiency</span>
            <span className="badge badge-success">100% In-Browser</span>
            <span className="badge badge-primary">Batch Ready</span>
          </div>
          <h1 className={styles.pageTitle}>
            Universal <span className="text-gradient">Image Converter</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Convert photos and graphics between WebP, PNG, JPG, and AVIF instantly in your browser. Compress size and scale resolution with zero cloud uploads.
          </p>
        </div>

        {items.length === 0 ? (
          <div className={styles.uploadSection}>
            <DropZone
              onFilesSelected={handleFilesSelected}
              accept="image/*"
              multiple={true}
              title="Drop images here to convert format"
              description="or click to browse multiple photos"
              supportedFormatsText="PNG, JPG, WEBP, AVIF, GIF, BMP"
            />
          </div>
        ) : (
          <div className={styles.workspace}>
            <div className={styles.leftCol}>
              <div className={`glass-panel ${styles.panel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleGroup}>
                    <ImageIcon size={18} className={styles.iconAccent} />
                    <h3 className={styles.panelTitle}>Images ({items.length})</h3>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setItems([])}
                  >
                    Clear All
                  </button>
                </div>

                <div className={styles.itemsList}>
                  {items.map((item) => (
                    <div key={item.id} className={styles.itemRow}>
                      <img src={item.previewUrl} alt={item.name} className={styles.thumb} />
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.name}</span>
                        <div className={styles.itemMeta}>
                          <span>{formatBytes(item.size)}</span>
                          {item.resultSize && (
                            <span className={styles.savedMeta}>
                              ➔ {formatBytes(item.resultSize)} (
                              {Math.round((1 - item.resultSize / item.size) * 100)}% saved)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.rowActions}>
                        {item.status === 'done' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleDownloadSingle(item)}
                          >
                            <Download size={14} />
                          </button>
                        )}
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setItems((p) => p.filter((x) => x.id !== item.id))}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.actionsBar}>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleConvertAll}
                    disabled={isProcessing}
                    style={{ width: '100%' }}
                  >
                    <Sparkles size={18} />
                    <span>
                      {isProcessing ? 'Converting...' : `Convert All to ${getExtension(targetFormat).toUpperCase()}`}
                    </span>
                  </button>

                  {hasDone && items.length > 1 && (
                    <button
                      className="btn btn-secondary"
                      onClick={handleDownloadAllZip}
                      style={{ width: '100%', marginTop: '10px' }}
                    >
                      <FolderArchive size={16} />
                      <span>Download All as ZIP</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.rightCol}>
              <div className={`glass-panel ${styles.panel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleGroup}>
                    <Settings size={18} className={styles.iconAccent} />
                    <h3 className={styles.panelTitle}>Conversion Settings</h3>
                  </div>
                </div>

                <div className={styles.settingsGrid}>
                  <div className={styles.settingField}>
                    <label className={styles.fieldLabel}>Target Format</label>
                    <div className={styles.toggleGroup3}>
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${targetFormat === 'image/webp' ? styles.toggleBtnActive : ''}`}
                        onClick={() => setTargetFormat('image/webp')}
                      >
                        WebP (Modern)
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${targetFormat === 'image/jpeg' ? styles.toggleBtnActive : ''}`}
                        onClick={() => setTargetFormat('image/jpeg')}
                      >
                        JPG (Universal)
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${targetFormat === 'image/png' ? styles.toggleBtnActive : ''}`}
                        onClick={() => setTargetFormat('image/png')}
                      >
                        PNG (Lossless)
                      </button>
                    </div>
                  </div>

                  <div className={styles.settingField}>
                    <div className={styles.fieldHeaderBetween}>
                      <label className={styles.fieldLabel}>Quality Compression</label>
                      <span className={styles.tagMono}>{Math.round(quality * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      disabled={targetFormat === 'image/png'}
                      className={styles.rangeInput}
                    />
                  </div>

                  <div className={styles.settingField}>
                    <label className={styles.fieldLabel}>Dimension Scale</label>
                    <select
                      value={scale}
                      onChange={(e) => setScale(parseFloat(e.target.value))}
                      className={styles.selectInput}
                    >
                      <option value="1">1x (Original Dimensions)</option>
                      <option value="0.75">0.75x (75% Scale)</option>
                      <option value="0.5">0.5x (50% Scale)</option>
                      <option value="2">2x (200% Upscale)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
