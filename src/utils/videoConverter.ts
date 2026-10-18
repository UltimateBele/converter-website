import {
  Conversion,
  BlobSource,
  BufferTarget,
  Input,
  Output,
  Mp4OutputFormat,
  ALL_FORMATS,
  QUALITY_HIGH,
  QUALITY_MEDIUM,
  QUALITY_LOW,
} from 'mediabunny';

export interface VideoConversionOptions {
  resolution?: 'original' | '1080p' | '720p' | '480p';
  quality?: 'high' | 'medium' | 'low';
  startTime?: number;
  endTime?: number;
  muteAudio?: boolean;
  onProgress?: (progress: number) => void;
  onStatus?: (status: string) => void;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

/**
 * Extracts basic video metadata using standard HTML5 video element
 */
export async function getVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      const meta: VideoMetadata = {
        duration: video.duration || 0,
        width: video.videoWidth || 1920,
        height: video.videoHeight || 1080,
      };
      URL.revokeObjectURL(url);
      resolve(meta);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ duration: 0, width: 1920, height: 1080 });
    };

    video.src = url;
  });
}

/**
 * Converts a MOV (or other video file) to MP4 client-side
 * Uses ultra-fast stream copy (lossless remuxing) for original resolution to avoid WebCodecs stalling on 4K/60fps HEVC iPhone videos.
 */
export async function convertMovToMp4(
  file: File,
  options: VideoConversionOptions = {}
): Promise<Blob> {
  const {
    resolution = 'original',
    quality = 'high',
    startTime,
    endTime,
    muteAudio = false,
    onProgress,
    onStatus,
  } = options;

  onStatus?.('Opening QuickTime container...');
  onProgress?.(5);

  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  });

  const target = new BufferTarget();
  const output = new Output({
    target,
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
  });

  const isOriginal = resolution === 'original';

  let targetHeight: number | undefined;
  if (resolution === '1080p') {
    targetHeight = 1080;
  } else if (resolution === '720p') {
    targetHeight = 720;
  } else if (resolution === '480p') {
    targetHeight = 480;
  }

  const qualityConstant =
    quality === 'high' ? QUALITY_HIGH : quality === 'medium' ? QUALITY_MEDIUM : QUALITY_LOW;

  // IMPORTANT: For original resolution, do NOT pass quality or dimensions.
  // Passing quality triggers full frame decoding & re-encoding in WebCodecs,
  // which can stall or run out of memory on high-res iPhone 4K/60fps HEVC video.
  // Omitting it triggers Mediabunny's fast EncodedVideoPacketSource (lossless stream copy)!
  const videoConfig = isOriginal
    ? {} // Packet Copy Mode (runs in < 1 second, 100% lossless!)
    : {
        height: targetHeight,
        fit: 'contain' as const,
        quality: qualityConstant,
      };

  onStatus?.(isOriginal ? 'Remuxing video streams directly (fast mode)...' : 'Initializing video encoder...');
  onProgress?.(15);

  const conversion = await Conversion.init({
    input,
    output,
    video: videoConfig,
    audio: muteAudio ? { discard: true } : undefined,
    trim:
      startTime !== undefined && endTime !== undefined && endTime > startTime
        ? { start: startTime, end: endTime }
        : undefined,
  });

  if (!conversion.isValid) {
    // If output is not valid (e.g. all tracks were discarded), check if video track exists
    const videoTracks = await input.getVideoTracks();
    if (videoTracks.length === 0) {
      throw new Error('No compatible video track found in this MOV file.');
    }
    throw new Error('This video file could not be remuxed to MP4.');
  }

  onProgress?.(25);
  onStatus?.('Writing MP4 video and audio packets...');

  conversion.onProgress = (p: number) => {
    // Scale progress between 25% and 95%
    const scaled = Math.min(95, 25 + Math.round(p * 70));
    onProgress?.(scaled);
  };

  await conversion.execute();

  onStatus?.('Finalizing MP4 file buffer...');
  onProgress?.(98);

  const buffer = target.buffer;
  if (!buffer) {
    throw new Error('Failed to generate MP4 video data.');
  }

  onProgress?.(100);
  onStatus?.('Done!');
  return new Blob([buffer], { type: 'video/mp4' });
}
