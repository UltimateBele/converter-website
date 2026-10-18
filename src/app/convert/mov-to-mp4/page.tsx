'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Video,
  Download,
  ArrowLeft,
  Settings,
  Sparkles,
  ShieldCheck,
  Check,
  Trash2,
  FolderArchive,
  Volume2,
  VolumeX,
  Play,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import DropZone from '@/components/DropZone';
import {
  convertMovToMp4,
  getVideoMetadata,
  VideoConversionOptions,
  VideoMetadata,
} from '@/utils/videoConverter';
import styles from './mov-to-mp4.module.css';

interface MovFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  previewUrl: string;
  metadata?: VideoMetadata;
  status: 'idle' | 'converting' | 'done' | 'error';
  progress: number;
  errorMessage?: string;
  resultBlob?: Blob;
  resultUrl?: string;
  resultSize?: number;
}

export default function MovToMp4Page() {
  const [items, setItems] = useState<MovFileItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Conversion settings
  const [resolution, setResolution] = useState<'original' | '1080p' | '720p' | '480p'>('original');
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [muteAudio, setMuteAudio] = useState<boolean>(false);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);

  // Global state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const selectedItem = items[selectedIndex] || null;

  // Handle files selected
  const handleFilesSelected = async (files: File[]) => {
    const newItems: MovFileItem[] = files.map((f, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      file: f,
      name: f.name,
      size: f.size,
      previewUrl: URL.createObjectURL(f),
      status: 'idle',
      progress: 0,
    }));

    const combined = [...items, ...newItems];
    setItems(combined);

    // Load metadata for first item
    if (items.length === 0 && newItems.length > 0) {
      setSelectedIndex(0);
      loadItemMetadata(newItems[0]);
    }
  };

  const loadItemMetadata = async (item: MovFileItem) => {
    try {
      const meta = await getVideoMetadata(item.file);
      item.metadata = meta;
      setTrimStart(0);
      setTrimEnd(Number(meta.duration.toFixed(1)));
      setItems((prev) => [...prev]);
    } catch (err) {
      console.warn('Could not read video metadata:', err);
    }
  };

  const handleSelectItem = (idx: number) => {
    setSelectedIndex(idx);
    const item = items[idx];
    if (item && !item.metadata) {
      loadItemMetadata(item);
    } else if (item?.metadata) {
      setTrimStart(0);
      setTrimEnd(Number(item.metadata.duration.toFixed(1)));
    }
  };

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = items.filter((item) => item.id !== id);
    setItems(filtered);
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1));
    }
  };

  const convertItem = async (item: MovFileItem): Promise<void> => {
    item.status = 'converting';
    item.progress = 5;
    setStatusMessage(`Preparing ${item.name}...`);
    setItems([...items]);

    const options: VideoConversionOptions = {
      resolution,
      quality,
      muteAudio,
      startTime: trimStart > 0 ? trimStart : undefined,
      endTime:
        trimEnd > 0 && item.metadata?.duration && trimEnd < item.metadata.duration
          ? trimEnd
          : undefined,
      onProgress: (p) => {
        item.progress = p;
        setItems([...items]);
      },
      onStatus: (msg) => {
        setStatusMessage(msg);
      },
    };

    setStatusMessage(`Converting ${item.name} to MP4...`);
    const mp4Blob = await convertMovToMp4(item.file, options);

    item.resultBlob = mp4Blob;
    item.resultUrl = URL.createObjectURL(mp4Blob);
    item.resultSize = mp4Blob.size;
    item.status = 'done';
    item.progress = 100;
    setItems([...items]);
  };

  const handleStartConversion = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    try {
      for (let i = 0; i < items.length; i++) {
        if (items[i].status !== 'done') {
          await convertItem(items[i]);
        }
      }

      setStatusMessage('Conversion completed successfully!');
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: unknown) {
      console.error(err);
      setStatusMessage(`Error: ${err instanceof Error ? err.message : 'Conversion failed'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (item: MovFileItem) => {
    if (!item.resultUrl) return;
    const cleanName = item.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = item.resultUrl;
    a.download = `${cleanName}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllZip = async () => {
    const doneItems = items.filter((it) => it.resultBlob);
    if (doneItems.length === 0) return;

    const zip = new JSZip();
    doneItems.forEach((item) => {
      const cleanName = item.name.replace(/\.[^/.]+$/, '');
      zip.file(`${cleanName}.mp4`, item.resultBlob!);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni-converted-videos-${Date.now()}.zip`;
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

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const hasCompletedItems = items.some((it) => it.status === 'done');

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
          <span className={styles.breadcrumbCurrent}>MOV to MP4</span>
        </div>

        {/* Hero Title */}
        <div className={styles.headerHero}>
          <div className={styles.badgeRow}>
            <span className="badge badge-primary">iPhone &amp; QuickTime</span>
            <span className="badge badge-success">100% In-Browser</span>
            <span className="badge badge-purple">Lossless Remux</span>
          </div>
          <h1 className={styles.pageTitle}>
            Convert <span className="text-gradient">MOV to MP4</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Convert Apple QuickTime (.mov) video recordings into universal MP4 format with zero cloud uploads. Scale resolution, trim clips, and compress size locally.
          </p>
        </div>

        {/* Upload or Workspace */}
        {items.length === 0 ? (
          <div className={styles.uploadSection}>
            <DropZone
              onFilesSelected={handleFilesSelected}
              accept="video/quicktime,.mov,.qt,video/*"
              multiple={true}
              title="Drop MOV or QuickTime video files here"
              description="or click to browse multiple video files"
              supportedFormatsText="MOV, QT, MP4"
            />
          </div>
        ) : (
          <div className={styles.workspace}>
            {/* Left Column: Queue & Batch Actions */}
            <div className={styles.leftCol}>
              <div className={`glass-panel ${styles.panel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleGroup}>
                    <Video size={18} className={styles.iconAccent} />
                    <h3 className={styles.panelTitle}>Video Queue ({items.length})</h3>
                  </div>

                  <label className={`btn btn-secondary btn-sm ${styles.addMoreBtn}`}>
                    <span>+ Add More</span>
                    <input
                      type="file"
                      accept="video/quicktime,.mov,.qt,video/*"
                      multiple
                      className={styles.hiddenFileInput}
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFilesSelected(Array.from(e.target.files));
                        }
                      }}
                    />
                  </label>
                </div>

                <div className={styles.itemsList}>
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`${styles.itemCard} ${
                        idx === selectedIndex ? styles.itemCardActive : ''
                      }`}
                      onClick={() => handleSelectItem(idx)}
                    >
                      <div className={styles.itemCardIcon}>
                        <Video size={18} />
                      </div>
                      <div className={styles.itemCardDetails}>
                        <span className={styles.itemCardName}>{item.name}</span>
                        <div className={styles.itemCardMeta}>
                          <span>{formatBytes(item.size)}</span>
                          {item.metadata?.duration ? (
                            <span>• {formatSeconds(item.metadata.duration)}</span>
                          ) : null}
                          {item.metadata?.width ? (
                            <span>• {item.metadata.width}p</span>
                          ) : null}
                          {item.status === 'done' && (
                            <span className={styles.itemBadgeDone}>
                              <Check size={12} /> Ready ({formatBytes(item.resultSize || 0)})
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => handleRemoveItem(item.id, e)}
                        title="Remove file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Batch Action Bar */}
                <div className={styles.actionsBar}>
                  <button
                    className="btn btn-primary"
                    onClick={handleStartConversion}
                    disabled={isProcessing}
                    style={{ width: '100%' }}
                  >
                    <Sparkles size={18} />
                    <span>
                      {isProcessing
                        ? 'Converting Locally...'
                        : hasCompletedItems
                        ? 'Re-convert Queue'
                        : `Convert ${items.length} ${items.length === 1 ? 'Video' : 'Videos'} to MP4`}
                    </span>
                  </button>

                  {hasCompletedItems && items.length > 1 && (
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

              {/* Progress Card */}
              {isProcessing && (
                <div className={`glass-panel ${styles.progressCard}`}>
                  <div className={styles.progressHeader}>
                    <span>{statusMessage || 'Processing video...'}</span>
                    <span>{selectedItem?.progress || 0}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${selectedItem?.progress || 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Settings & Video Preview */}
            <div className={styles.rightCol}>
              {/* Settings Panel */}
              <div className={`glass-panel ${styles.panel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleGroup}>
                    <Settings size={18} className={styles.iconAccent} />
                    <h3 className={styles.panelTitle}>MP4 Export Settings</h3>
                  </div>
                  <span className="badge badge-primary">MP4 Container</span>
                </div>

                <div className={styles.settingsGrid}>
                  {/* Resolution Scaling */}
                  <div className={styles.settingField}>
                    <div className={styles.fieldHeaderBetween}>
                      <label className={styles.fieldLabel}>Output Resolution</label>
                      {resolution === 'original' && (
                        <span className={styles.durationTag} style={{ color: '#34d399' }}>
                          ⚡ Lossless Fast Remux
                        </span>
                      )}
                    </div>
                    <div className={styles.toggleGroup4}>
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${resolution === 'original' ? styles.toggleBtnActive : ''}`}
                        onClick={() => setResolution('original')}
                      >
                        Original
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${resolution === '1080p' ? styles.toggleBtnActive : ''}`}
                        onClick={() => setResolution('1080p')}
                      >
                        1080p FHD
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${resolution === '720p' ? styles.toggleBtnActive : ''}`}
                        onClick={() => setResolution('720p')}
                      >
                        720p HD
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${resolution === '480p' ? styles.toggleBtnActive : ''}`}
                        onClick={() => setResolution('480p')}
                      >
                        480p SD
                      </button>
                    </div>
                  </div>

                  {/* Quality & Audio Mute */}
                  <div className={styles.settingRow2}>
                    <div className={styles.settingField}>
                      <label className={styles.fieldLabel}>Video Quality</label>
                      <select
                        value={quality}
                        onChange={(e) => setQuality(e.target.value as 'high' | 'medium' | 'low')}
                        className={styles.selectInput}
                        disabled={resolution === 'original'}
                      >
                        {resolution === 'original' ? (
                          <option value="high">Lossless (Preserve Original Stream)</option>
                        ) : (
                          <>
                            <option value="high">High (Recommended)</option>
                            <option value="medium">Medium (Smaller Size)</option>
                            <option value="low">Low (Compact)</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className={styles.settingField}>
                      <label className={styles.fieldLabel}>Audio Track</label>
                      <button
                        type="button"
                        className={`${styles.muteToggleBtn} ${muteAudio ? styles.muteActive : ''}`}
                        onClick={() => setMuteAudio(!muteAudio)}
                      >
                        {muteAudio ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        <span>{muteAudio ? 'Muted (Video Only)' : 'Include Audio'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Trimming */}
                  {selectedItem?.metadata?.duration ? (
                    <div className={styles.settingField}>
                      <div className={styles.fieldHeaderBetween}>
                        <label className={styles.fieldLabel}>Video Trimming (Seconds)</label>
                        <span className={styles.durationTag}>
                          Duration: {formatSeconds(selectedItem.metadata.duration)}
                        </span>
                      </div>
                      <div className={styles.trimInputs}>
                        <div className={styles.timeInputBox}>
                          <span>Start:</span>
                          <input
                            type="number"
                            min="0"
                            max={selectedItem.metadata.duration}
                            step="0.5"
                            value={trimStart}
                            onChange={(e) => setTrimStart(Math.max(0, parseFloat(e.target.value) || 0))}
                            className={styles.numericInput}
                          />
                          <span>s</span>
                        </div>
                        <span className={styles.rangeDivider}>→</span>
                        <div className={styles.timeInputBox}>
                          <span>End:</span>
                          <input
                            type="number"
                            min="0"
                            max={selectedItem.metadata.duration}
                            step="0.5"
                            value={trimEnd}
                            onChange={(e) => setTrimEnd(parseFloat(e.target.value) || selectedItem.metadata!.duration)}
                            className={styles.numericInput}
                          />
                          <span>s</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Result Preview & Download Box */}
              {selectedItem?.status === 'done' && selectedItem.resultUrl ? (
                <div className={`glass-panel ${styles.resultCard}`}>
                  <div className={styles.resultHeader}>
                    <div className={styles.resultTitleGroup}>
                      <div className={styles.resultCheckCircle}>
                        <Check size={20} />
                      </div>
                      <div>
                        <h4 className={styles.resultTitle}>MP4 Ready for Download!</h4>
                        <p className={styles.resultStats}>
                          Original: {formatBytes(selectedItem.size)} ➔ MP4:{' '}
                          <span className={styles.highlightText}>
                            {formatBytes(selectedItem.resultSize || 0)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={() => handleDownloadSingle(selectedItem)}
                    >
                      <Download size={18} />
                      <span>Download MP4</span>
                    </button>
                  </div>

                  {/* Video Player Preview */}
                  <div className={styles.videoPlayerBox}>
                    <video
                      src={selectedItem.resultUrl}
                      controls
                      className={styles.nativeVideo}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Benefits Section */}
        <div className={styles.infoSection}>
          <div className={styles.infoGrid}>
            <div className={`glass-panel ${styles.infoCard}`}>
              <ShieldCheck size={28} className={styles.infoIcon} />
              <h4>Private iPhone &amp; Mac Conversion</h4>
              <p>
                iPhones record in QuickTime MOV by default. Converting them to MP4 enables universal playback on Windows, Android, and smart TVs without uploading your personal videos to third-party cloud servers.
              </p>
            </div>
            <div className={`glass-panel ${styles.infoCard}`}>
              <Sparkles size={28} className={styles.infoIcon} />
              <h4>Zero File Limits</h4>
              <p>
                Video files are naturally large. Most online converters hit you with a 50MB paywall. Because OmniConvert runs locally using modern WebAssembly and WebCodecs, 4K videos are processed without limits.
              </p>
            </div>
            <div className={`glass-panel ${styles.infoCard}`}>
              <Video size={28} className={styles.infoIcon} />
              <h4>Fast &amp; High Compatibility</h4>
              <p>
                When video tracks are already in H.264 or compatible streams, our engine repacks the container at blinding speed, preserving original pixel quality and color accuracy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
