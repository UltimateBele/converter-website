'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Music,
  Download,
  ArrowLeft,
  Settings,
  Sparkles,
  ShieldCheck,
  Check,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sliders,
  FileAudio,
  Trash2,
  FolderArchive,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import DropZone from '@/components/DropZone';
import {
  decodeAudioFromFile,
  encodeAudioBufferToMp3,
  encodeAudioBufferToWav,
} from '@/utils/audioEncoder';
import styles from './mp4-to-mp3.module.css';

interface VideoFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  videoUrl?: string;
  audioBuffer?: AudioBuffer;
  duration?: number;
  status: 'idle' | 'decoding' | 'encoding' | 'done' | 'error';
  progress: number;
  errorMessage?: string;
  resultBlob?: Blob;
  resultUrl?: string;
  resultSize?: number;
}

export default function Mp4ToMp3Page() {
  const [items, setItems] = useState<VideoFileItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Audio settings
  const [format, setFormat] = useState<'mp3' | 'wav'>('mp3');
  const [bitrate, setBitrate] = useState<128 | 192 | 256 | 320>(256);
  const [channels, setChannels] = useState<'stereo' | 'mono'>('stereo');
  const [volume, setVolume] = useState<number>(1.0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);

  // Metadata tags
  const [title, setTitle] = useState<string>('');
  const [artist, setArtist] = useState<string>('');
  const [album, setAlbum] = useState<string>('');
  const [year, setYear] = useState<string>('2026');

  // Global processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Audio preview playback
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  const selectedItem = items[selectedIndex] || null;

  // Handle file selection
  const handleFilesSelected = async (files: File[]) => {
    const newItems: VideoFileItem[] = files.map((f, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      file: f,
      name: f.name,
      size: f.size,
      status: 'idle',
      progress: 0,
    }));

    const combined = [...items, ...newItems];
    setItems(combined);

    // If first selection, initialize selected item and load audio metadata
    if (items.length === 0 && newItems.length > 0) {
      setSelectedIndex(0);
      loadMediaForPreview(newItems[0]);
    }
  };

  // Load video & audio buffer for the preview
  const loadMediaForPreview = async (item: VideoFileItem) => {
    const url = URL.createObjectURL(item.file);
    item.videoUrl = url;

    // Set initial title from file name without extension
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    setTitle(baseName);

    try {
      setStatusMessage('Analyzing audio track in browser...');
      const buffer = await decodeAudioFromFile(item.file);
      item.audioBuffer = buffer;
      item.duration = buffer.duration;
      setTrimStart(0);
      setTrimEnd(Number(buffer.duration.toFixed(2)));
      setStatusMessage('');
      setItems((prev) => [...prev]);
    } catch (err) {
      console.warn('Direct decodeAudioData failed, will decode on render:', err);
      setStatusMessage('');
    }
  };

  const handleSelectItem = (idx: number) => {
    setSelectedIndex(idx);
    const item = items[idx];
    if (item && !item.audioBuffer && item.status === 'idle') {
      loadMediaForPreview(item);
    }
    if (item?.duration) {
      setTrimStart(0);
      setTrimEnd(Number(item.duration.toFixed(2)));
    }
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    setTitle(baseName);
  };

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = items.filter((item) => item.id !== id);
    setItems(filtered);
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1));
    }
  };

  // Run conversion for single item or all
  const convertItem = async (item: VideoFileItem): Promise<void> => {
    item.status = 'decoding';
    item.progress = 10;
    setStatusMessage(`Decoding audio track: ${item.name}...`);
    setItems([...items]);

    let audioBuffer = item.audioBuffer;
    if (!audioBuffer) {
      audioBuffer = await decodeAudioFromFile(item.file);
      item.audioBuffer = audioBuffer;
      item.duration = audioBuffer.duration;
    }

    item.status = 'encoding';
    item.progress = 25;
    setStatusMessage(`Encoding ${format.toUpperCase()} at ${bitrate} kbps...`);
    setItems([...items]);

    const actualTrimStart = trimStart >= 0 ? trimStart : 0;
    const actualTrimEnd = trimEnd > 0 && trimEnd <= audioBuffer.duration ? trimEnd : audioBuffer.duration;

    let resultBlob: Blob;

    if (format === 'wav') {
      resultBlob = encodeAudioBufferToWav(
        audioBuffer,
        actualTrimStart,
        actualTrimEnd,
        volume
      );
      item.progress = 100;
    } else {
      resultBlob = await encodeAudioBufferToMp3(audioBuffer, {
        bitrate,
        channels,
        startTime: actualTrimStart,
        endTime: actualTrimEnd,
        volume,
        metadata: {
          title: title || item.name.replace(/\.[^/.]+$/, ''),
          artist,
          album,
          year,
        },
        onProgress: (p) => {
          item.progress = 25 + Math.round(p * 0.75);
          setItems([...items]);
        },
      });
    }

    item.resultBlob = resultBlob;
    item.resultUrl = URL.createObjectURL(resultBlob);
    item.resultSize = resultBlob.size;
    item.status = 'done';
    item.progress = 100;
    setItems([...items]);
  };

  const handleStartConversion = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    try {
      // Process idle items
      for (let i = 0; i < items.length; i++) {
        if (items[i].status !== 'done') {
          await convertItem(items[i]);
        }
      }

      setStatusMessage('Conversion complete!');
      confetti({
        particleCount: 80,
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

  const handleDownloadSingle = (item: VideoFileItem) => {
    if (!item.resultUrl) return;
    const ext = format === 'wav' ? 'wav' : 'mp3';
    const cleanName = item.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = item.resultUrl;
    a.download = `${cleanName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllZip = async () => {
    const doneItems = items.filter((it) => it.resultBlob);
    if (doneItems.length === 0) return;

    const zip = new JSZip();
    const ext = format === 'wav' ? 'wav' : 'mp3';

    doneItems.forEach((item) => {
      const cleanName = item.name.replace(/\.[^/.]+$/, '');
      zip.file(`${cleanName}.${ext}`, item.resultBlob!);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni-converted-audio-${Date.now()}.zip`;
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
        {/* Breadcrumb & Navigation */}
        <div className={styles.breadcrumbBar}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>All Converters</span>
          </Link>
          <span className={styles.breadcrumbDivider}>/</span>
          <span className={styles.breadcrumbCurrent}>MP4 to MP3</span>
        </div>

        {/* Hero Title Header */}
        <div className={styles.headerHero}>
          <div className={styles.badgeRow}>
            <span className="badge badge-primary">High Fidelity Audio</span>
            <span className="badge badge-success">100% In-Browser</span>
            <span className="badge badge-purple">No File Limits</span>
          </div>
          <h1 className={styles.pageTitle}>
            Convert <span className="text-gradient">MP4 to MP3</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Extract studio-grade MP3 audio from MP4, MOV, and WebM videos. Trim sections, boost volume, choose bitrates up to 320 kbps, and tag metadata with zero cloud uploads.
          </p>
        </div>

        {/* Main Work Area */}
        {items.length === 0 ? (
          /* Empty State: Dropzone */
          <div className={styles.uploadSection}>
            <DropZone
              onFilesSelected={handleFilesSelected}
              accept="video/*,audio/*,.mp4,.mov,.webm,.mkv,.avi,.m4v"
              multiple={true}
              title="Drop MP4 or Video files here"
              description="or click to browse from your device (batch support)"
              supportedFormatsText="MP4, MOV, WEBM, MKV, AVI, M4V"
            />
          </div>
        ) : (
          /* Active State: File List + Settings + Preview */
          <div className={styles.workspace}>
            {/* Left Column: Items List & Drop more */}
            <div className={styles.leftCol}>
              <div className={`glass-panel ${styles.panel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleGroup}>
                    <FileAudio size={18} className={styles.iconAccent} />
                    <h3 className={styles.panelTitle}>Queue ({items.length})</h3>
                  </div>
                  <label className={`btn btn-secondary btn-sm ${styles.addMoreBtn}`}>
                    <span>+ Add More</span>
                    <input
                      type="file"
                      accept="video/*,audio/*,.mp4,.mov,.webm,.mkv,.avi"
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
                        <Music size={18} />
                      </div>
                      <div className={styles.itemCardDetails}>
                        <span className={styles.itemCardName}>{item.name}</span>
                        <div className={styles.itemCardMeta}>
                          <span>{formatBytes(item.size)}</span>
                          {item.duration && <span>• {formatSeconds(item.duration)}</span>}
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
                        : `Convert ${items.length} ${items.length === 1 ? 'Video' : 'Videos'} to ${format.toUpperCase()}`}
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

              {/* Status Message / Progress */}
              {isProcessing && (
                <div className={`glass-panel ${styles.progressCard}`}>
                  <div className={styles.progressHeader}>
                    <span>{statusMessage || 'Processing audio...'}</span>
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

            {/* Right Column: Settings & Live Preview */}
            <div className={styles.rightCol}>
              {/* Audio Settings Panel */}
              <div className={`glass-panel ${styles.panel}`}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleGroup}>
                    <Settings size={18} className={styles.iconAccent} />
                    <h3 className={styles.panelTitle}>Audio Configuration</h3>
                  </div>
                  <span className="badge badge-primary">{format.toUpperCase()}</span>
                </div>

                <div className={styles.settingsGrid}>
                  {/* Output Format */}
                  <div className={styles.settingField}>
                    <label className={styles.fieldLabel}>Output Format</label>
                    <div className={styles.toggleGroup}>
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${format === 'mp3' ? styles.toggleBtnActive : ''}`}
                        onClick={() => setFormat('mp3')}
                      >
                        MP3 (Compressed)
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${format === 'wav' ? styles.toggleBtnActive : ''}`}
                        onClick={() => setFormat('wav')}
                      >
                        WAV (Lossless PCM)
                      </button>
                    </div>
                  </div>

                  {/* Bitrate Selector (for MP3) */}
                  {format === 'mp3' && (
                    <div className={styles.settingField}>
                      <label className={styles.fieldLabel}>Audio Bitrate</label>
                      <div className={styles.bitrateOptions}>
                        {([320, 256, 192, 128] as const).map((b) => (
                          <button
                            key={b}
                            type="button"
                            className={`${styles.chipBtn} ${bitrate === b ? styles.chipBtnActive : ''}`}
                            onClick={() => setBitrate(b)}
                          >
                            <span className={styles.chipNumber}>{b}</span>
                            <span className={styles.chipUnit}>kbps</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Channels & Volume */}
                  <div className={styles.settingRow2}>
                    <div className={styles.settingField}>
                      <label className={styles.fieldLabel}>Channels</label>
                      <select
                        value={channels}
                        onChange={(e) => setChannels(e.target.value as 'stereo' | 'mono')}
                        className={styles.selectInput}
                      >
                        <option value="stereo">Stereo (2 Channels)</option>
                        <option value="mono">Mono (1 Channel)</option>
                      </select>
                    </div>

                    <div className={styles.settingField}>
                      <label className={styles.fieldLabel}>Volume Boost</label>
                      <select
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className={styles.selectInput}
                      >
                        <option value="1.0">100% (Original)</option>
                        <option value="1.25">125% (+25%)</option>
                        <option value="1.5">150% (+50%)</option>
                        <option value="2.0">200% (2x Boost)</option>
                      </select>
                    </div>
                  </div>

                  {/* Audio Trimming */}
                  {selectedItem?.duration && (
                    <div className={styles.settingField}>
                      <div className={styles.fieldHeaderBetween}>
                        <label className={styles.fieldLabel}>Audio Trimming (Range)</label>
                        <span className={styles.durationTag}>
                          Total: {formatSeconds(selectedItem.duration)}
                        </span>
                      </div>
                      <div className={styles.trimInputs}>
                        <div className={styles.timeInputBox}>
                          <span>Start:</span>
                          <input
                            type="number"
                            min="0"
                            max={selectedItem.duration}
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
                            max={selectedItem.duration}
                            step="0.5"
                            value={trimEnd}
                            onChange={(e) => setTrimEnd(parseFloat(e.target.value) || selectedItem.duration || 0)}
                            className={styles.numericInput}
                          />
                          <span>s</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ID3 Metadata Tags */}
                  <div className={styles.settingField}>
                    <label className={styles.fieldLabel}>Metadata (ID3 Tags)</label>
                    <div className={styles.metaGrid}>
                      <input
                        type="text"
                        placeholder="Song Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={styles.textInput}
                      />
                      <input
                        type="text"
                        placeholder="Artist / Creator"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        className={styles.textInput}
                      />
                      <input
                        type="text"
                        placeholder="Album Name"
                        value={album}
                        onChange={(e) => setAlbum(e.target.value)}
                        className={styles.textInput}
                      />
                      <input
                        type="text"
                        placeholder="Year (e.g. 2026)"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className={styles.textInput}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Audio Player & Download Box */}
              {selectedItem?.status === 'done' && selectedItem.resultUrl && (
                <div className={`glass-panel ${styles.resultCard}`}>
                  <div className={styles.resultHeader}>
                    <div className={styles.resultTitleGroup}>
                      <div className={styles.resultCheckCircle}>
                        <Check size={20} />
                      </div>
                      <div>
                        <h4 className={styles.resultTitle}>Ready for Download!</h4>
                        <p className={styles.resultStats}>
                          Original: {formatBytes(selectedItem.size)} ➔ Converted:{' '}
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
                      <span>Download {format.toUpperCase()}</span>
                    </button>
                  </div>

                  {/* Embedded Audio Player */}
                  <div className={styles.playerContainer}>
                    <audio
                      ref={audioPlayerRef}
                      src={selectedItem.resultUrl}
                      controls
                      className={styles.nativeAudio}
                      onPlay={() => setIsPlayingAudio(true)}
                      onPause={() => setIsPlayingAudio(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Why this is better section */}
        <div className={styles.infoSection}>
          <div className={styles.infoGrid}>
            <div className={`glass-panel ${styles.infoCard}`}>
              <ShieldCheck size={28} className={styles.infoIcon} />
              <h4>100% Private &amp; Offline-Ready</h4>
              <p>
                Your video is decoded and encoded strictly within your web browser using Web Audio and WebAssembly. No files are uploaded to any remote server or stored in the cloud.
              </p>
            </div>
            <div className={`glass-panel ${styles.infoCard}`}>
              <Sparkles size={28} className={styles.infoIcon} />
              <h4>No 50MB File Limits</h4>
              <p>
                Traditional converter sites restrict free users to 25MB or 50MB and make you wait in queues. Because OmniConvert runs locally, you can convert multi-gigabyte videos without paying a cent.
              </p>
            </div>
            <div className={`glass-panel ${styles.infoCard}`}>
              <Music size={28} className={styles.infoIcon} />
              <h4>Studio Quality Audio</h4>
              <p>
                Extract pristine 320 kbps MP3 or pure lossless WAV. Customize volume boost, stereo downmixing, and embed ID3 tags so your tracks look great in music libraries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
