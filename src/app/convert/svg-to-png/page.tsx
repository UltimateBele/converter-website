'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Download,
  ArrowLeft,
  Settings,
  ShieldCheck,
  Check,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import DropZone from '@/components/DropZone';
import styles from './svg-to-png.module.css';

export default function SvgToPngPage() {
  const [svgContent, setSvgContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('vector-graphic.png');
  const [scale, setScale] = useState<number>(2);
  const [background, setBackground] = useState<'transparent' | 'white' | 'dark' | 'custom'>('transparent');
  const [customColor, setCustomColor] = useState<string>('#6366f1');

  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [pngSize, setPngSize] = useState<number>(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isRendering, setIsRendering] = useState<boolean>(false);

  const handleFilesSelected = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setFileName(file.name.replace(/\.[^/.]+$/, '') + '.png');
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSvgContent(content);
      renderSvgToPng(content, scale, background, customColor);
    };
    reader.readAsText(file);
  };

  const renderSvgToPng = (
    svgStr: string,
    scaleFactor: number,
    bgType: 'transparent' | 'white' | 'dark' | 'custom',
    customBg: string
  ) => {
    if (!svgStr) return;
    setIsRendering(true);

    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const baseWidth = img.naturalWidth || 800;
      const baseHeight = img.naturalHeight || 800;
      const targetWidth = Math.round(baseWidth * scaleFactor);
      const targetHeight = Math.round(baseHeight * scaleFactor);

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      setDimensions({ width: targetWidth, height: targetHeight });

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsRendering(false);
        return;
      }

      // Background fill
      if (bgType === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else if (bgType === 'dark') {
        ctx.fillStyle = '#080b12';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else if (bgType === 'custom') {
        ctx.fillStyle = customBg;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          setIsRendering(false);
          return;
        }
        const generatedUrl = URL.createObjectURL(pngBlob);
        setPngUrl(generatedUrl);
        setPngSize(pngBlob.size);
        setIsRendering(false);
      }, 'image/png');

      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      setIsRendering(false);
    };

    img.src = url;
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
    if (svgContent) {
      renderSvgToPng(svgContent, newScale, background, customColor);
    }
  };

  const handleBgChange = (newBg: 'transparent' | 'white' | 'dark' | 'custom') => {
    setBackground(newBg);
    if (svgContent) {
      renderSvgToPng(svgContent, scale, newBg, customColor);
    }
  };

  const handleDownload = () => {
    if (!pngUrl) return;
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className={styles.pageWrapper}>
      <div className="container">
        <div className={styles.breadcrumbBar}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>All Converters</span>
          </Link>
          <span className={styles.breadcrumbDivider}>/</span>
          <span className={styles.breadcrumbCurrent}>SVG to PNG</span>
        </div>

        <div className={styles.headerHero}>
          <div className={styles.badgeRow}>
            <span className="badge badge-primary">Vector Rasterizer</span>
            <span className="badge badge-success">100% In-Browser</span>
            <span className="badge badge-purple">Up to 8x Crisp Scaling</span>
          </div>
          <h1 className={styles.pageTitle}>
            Convert <span className="text-gradient">SVG to PNG</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Transform vector SVGs into high-resolution PNGs up to 8x resolution for print and Retina displays with transparent or solid backgrounds.
          </p>
        </div>

        {!svgContent ? (
          <div className={styles.uploadSection}>
            <DropZone
              onFilesSelected={handleFilesSelected}
              accept=".svg,image/svg+xml"
              multiple={false}
              title="Drop an SVG file here"
              description="or click to browse your computer"
              supportedFormatsText="SVG"
            />
          </div>
        ) : (
          <div className={styles.workspace}>
            <div className={styles.leftCol}>
              <div className={`glass-panel ${styles.panel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleGroup}>
                    <Layers size={18} className={styles.iconAccent} />
                    <h3 className={styles.panelTitle}>Raster Preview</h3>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setSvgContent('');
                      setPngUrl(null);
                    }}
                  >
                    Upload Another SVG
                  </button>
                </div>

                <div
                  className={`${styles.previewBox} ${
                    background === 'transparent' ? styles.checkerboard : ''
                  }`}
                  style={{
                    backgroundColor:
                      background === 'white'
                        ? '#ffffff'
                        : background === 'dark'
                        ? '#080b12'
                        : background === 'custom'
                        ? customColor
                        : undefined,
                  }}
                >
                  {pngUrl && (
                    <img src={pngUrl} alt="SVG Preview" className={styles.previewImage} />
                  )}
                </div>

                {pngUrl && (
                  <div className={styles.downloadRow}>
                    <div className={styles.metaBox}>
                      <span className={styles.metaDim}>
                        Resolution: {dimensions.width} × {dimensions.height} px
                      </span>
                      <span className={styles.metaSize}>Size: {formatBytes(pngSize)}</span>
                    </div>

                    <button className="btn btn-primary btn-lg" onClick={handleDownload}>
                      <Download size={18} />
                      <span>Download PNG</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.rightCol}>
              <div className={`glass-panel ${styles.panel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleGroup}>
                    <Settings size={18} className={styles.iconAccent} />
                    <h3 className={styles.panelTitle}>Rendering Quality</h3>
                  </div>
                </div>

                <div className={styles.settingsGrid}>
                  <div className={styles.settingField}>
                    <label className={styles.fieldLabel}>Resolution Scale</label>
                    <div className={styles.scaleGrid}>
                      {[1, 2, 4, 8].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`${styles.scaleBtn} ${scale === s ? styles.scaleBtnActive : ''}`}
                          onClick={() => handleScaleChange(s)}
                        >
                          <span className={styles.scaleVal}>{s}x</span>
                          <span className={styles.scaleDesc}>
                            {s === 1 ? 'Standard' : s === 2 ? 'Retina' : s === 4 ? 'Ultra HD' : 'Print Max'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.settingField}>
                    <label className={styles.fieldLabel}>Background Canvas</label>
                    <div className={styles.bgGrid}>
                      <button
                        type="button"
                        className={`${styles.bgBtn} ${background === 'transparent' ? styles.bgBtnActive : ''}`}
                        onClick={() => handleBgChange('transparent')}
                      >
                        Transparent
                      </button>
                      <button
                        type="button"
                        className={`${styles.bgBtn} ${background === 'white' ? styles.bgBtnActive : ''}`}
                        onClick={() => handleBgChange('white')}
                      >
                        White
                      </button>
                      <button
                        type="button"
                        className={`${styles.bgBtn} ${background === 'dark' ? styles.bgBtnActive : ''}`}
                        onClick={() => handleBgChange('dark')}
                      >
                        Dark
                      </button>
                    </div>
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
