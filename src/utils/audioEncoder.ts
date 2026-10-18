import { Mp3Encoder } from '@breezystack/lamejs';
import { Input, BlobSource, ALL_FORMATS, AudioBufferSink } from 'mediabunny';

export interface AudioConversionOptions {
  bitrate: 128 | 192 | 256 | 320;
  channels: 'stereo' | 'mono';
  startTime?: number; // in seconds
  endTime?: number;   // in seconds
  volume?: number;    // 1.0 = 100%, 1.5 = 150%, etc.
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
    year?: string;
  };
  onProgress?: (progress: number) => void; // 0 to 100
}

/**
 * Converts Float32Array PCM data to 16-bit PCM Int16Array with volume scaling
 */
function floatTo16BitPCM(input: Float32Array, output: Int16Array, volume: number = 1.0) {
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i] * volume));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
}

/**
 * Creates an ID3v2.3 tag header and frames for MP3 metadata
 */
function createID3Tag(meta: NonNullable<AudioConversionOptions['metadata']>): Uint8Array {
  const frames: number[] = [];

  const addFrame = (id: string, text: string) => {
    if (!text) return;
    const utf8 = new TextEncoder().encode(text);
    const content = [0, ...utf8]; // 0 = ISO-8859-1 / UTF-8 basic
    const size = content.length;
    // Frame ID (4 bytes)
    for (let i = 0; i < 4; i++) frames.push(id.charCodeAt(i));
    // Size (4 bytes, 32-bit big-endian)
    frames.push((size >> 24) & 0xff);
    frames.push((size >> 16) & 0xff);
    frames.push((size >> 8) & 0xff);
    frames.push(size & 0xff);
    // Flags (2 bytes)
    frames.push(0, 0);
    // Content
    frames.push(...content);
  };

  if (meta.title) addFrame('TIT2', meta.title);
  if (meta.artist) addFrame('TPE1', meta.artist);
  if (meta.album) addFrame('TALB', meta.album);
  if (meta.year) addFrame('TYER', meta.year);

  if (frames.length === 0) return new Uint8Array(0);

  const tagSize = frames.length;
  // Syncsafe integer for ID3 header
  const synchsafe = [
    (tagSize >> 21) & 0x7f,
    (tagSize >> 14) & 0x7f,
    (tagSize >> 7) & 0x7f,
    tagSize & 0x7f,
  ];

  const header = [
    0x49, 0x44, 0x33, // 'ID3'
    0x03, 0x00,       // version 2.3.0
    0x00,             // flags
    ...synchsafe
  ];

  return new Uint8Array([...header, ...frames]);
}

/**
 * Decodes video/audio file into an AudioBuffer using browser native Web Audio API with Mediabunny fallback
 */
export async function decodeAudioFromFile(file: File): Promise<AudioBuffer> {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  // 1. Try native Web Audio decodeAudioData
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    return audioBuffer;
  } catch {
    // 2. If native decodeAudioData fails (common on video containers with video tracks in Safari/Chrome),
    // use Mediabunny's AudioBufferSink to demux & decode the audio track!
    try {
      const input = new Input({
        source: new BlobSource(file),
        formats: ALL_FORMATS,
      });

      const audioTrack = await input.getPrimaryAudioTrack();
      if (!audioTrack) {
        throw new Error('No audio track found in this video file.');
      }

      const sink = new AudioBufferSink(audioTrack);
      const audioBuffers: AudioBuffer[] = [];
      let totalLength = 0;
      let sampleRate = 44100;
      let numberOfChannels = 2;

      for await (const wrapped of sink.buffers()) {
        audioBuffers.push(wrapped.buffer);
        totalLength += wrapped.buffer.length;
        sampleRate = wrapped.buffer.sampleRate;
        numberOfChannels = Math.max(numberOfChannels, wrapped.buffer.numberOfChannels);
      }

      if (totalLength === 0) {
        throw new Error('Audio track is empty.');
      }

      const combinedBuffer = audioCtx.createBuffer(numberOfChannels, totalLength, sampleRate);
      for (let c = 0; c < numberOfChannels; c++) {
        const channelData = combinedBuffer.getChannelData(c);
        let offset = 0;
        for (const b of audioBuffers) {
          if (c < b.numberOfChannels) {
            channelData.set(b.getChannelData(c), offset);
          }
          offset += b.length;
        }
      }

      return combinedBuffer;
    } catch (fallbackErr) {
      console.error('Audio decoding error:', fallbackErr);
      throw new Error('Could not decode audio from this file format.');
    }
  } finally {
    if (audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }
  }
}

/**
 * Encodes an AudioBuffer into an MP3 Blob with configurable bitrate, trimming, volume, and metadata
 */
export async function encodeAudioBufferToMp3(
  audioBuffer: AudioBuffer,
  options: AudioConversionOptions
): Promise<Blob> {
  const {
    bitrate = 256,
    channels = 'stereo',
    startTime = 0,
    endTime = audioBuffer.duration,
    volume = 1.0,
    metadata,
    onProgress
  } = options;

  const sampleRate = audioBuffer.sampleRate;
  const numChannels = channels === 'mono' ? 1 : Math.min(2, audioBuffer.numberOfChannels);

  // Calculate sample slicing boundaries for trimming
  const startSample = Math.max(0, Math.floor(startTime * sampleRate));
  const endSample = Math.min(audioBuffer.length, Math.floor(endTime * sampleRate));
  const totalSamples = Math.max(0, endSample - startSample);

  if (totalSamples <= 0) {
    throw new Error('Selected audio duration is invalid or zero.');
  }

  // Extract channel data
  const leftSource = audioBuffer.getChannelData(0).subarray(startSample, endSample);
  let rightSource: Float32Array;

  if (numChannels === 1) {
    if (audioBuffer.numberOfChannels > 1) {
      // Downmix stereo to mono
      const rightChannel = audioBuffer.getChannelData(1).subarray(startSample, endSample);
      const mono = new Float32Array(totalSamples);
      for (let i = 0; i < totalSamples; i++) {
        mono[i] = (leftSource[i] + rightChannel[i]) * 0.5;
      }
      rightSource = mono;
    } else {
      rightSource = leftSource;
    }
  } else {
    // Stereo
    rightSource = audioBuffer.numberOfChannels > 1
      ? audioBuffer.getChannelData(1).subarray(startSample, endSample)
      : leftSource;
  }

  // Convert float samples to 16-bit PCM
  const leftPCM = new Int16Array(totalSamples);
  floatTo16BitPCM(leftSource, leftPCM, volume);

  let rightPCM: Int16Array;
  if (numChannels === 2) {
    rightPCM = new Int16Array(totalSamples);
    floatTo16BitPCM(rightSource, rightPCM, volume);
  } else {
    rightPCM = leftPCM;
  }

  const mp3encoder = new Mp3Encoder(numChannels, sampleRate, bitrate);
  const mp3DataParts: Uint8Array[] = [];

  // Add ID3 Tag header if metadata is present
  if (metadata && (metadata.title || metadata.artist || metadata.album || metadata.year)) {
    const id3 = createID3Tag(metadata);
    if (id3.length > 0) {
      mp3DataParts.push(id3);
    }
  }

  const sampleBlockSize = 1152;
  const totalBlocks = Math.ceil(totalSamples / sampleBlockSize);

  // Encode in chunks to prevent UI blocking
  for (let i = 0; i < totalSamples; i += sampleBlockSize) {
    const chunkLeft = leftPCM.subarray(i, i + sampleBlockSize);
    let mp3buf: Int8Array | Uint8Array;

    if (numChannels === 1) {
      mp3buf = mp3encoder.encodeBuffer(chunkLeft);
    } else {
      const chunkRight = rightPCM.subarray(i, i + sampleBlockSize);
      mp3buf = mp3encoder.encodeBuffer(chunkLeft, chunkRight);
    }

    if (mp3buf.length > 0) {
      mp3DataParts.push(new Uint8Array(mp3buf));
    }

    // Yield control periodically to keep browser UI smooth
    if ((i / sampleBlockSize) % 25 === 0) {
      const progressPercent = Math.min(99, Math.round((i / totalSamples) * 100));
      onProgress?.(progressPercent);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  // Flush remaining buffer
  const flushed = mp3encoder.flush();
  if (flushed.length > 0) {
    mp3DataParts.push(new Uint8Array(flushed));
  }

  onProgress?.(100);

  return new Blob(mp3DataParts as unknown as BlobPart[], { type: 'audio/mp3' });
}

/**
 * Exports AudioBuffer as lossless WAV Blob
 */
export function encodeAudioBufferToWav(
  audioBuffer: AudioBuffer,
  startTime: number = 0,
  endTime: number = audioBuffer.duration,
  volume: number = 1.0
): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.max(0, Math.floor(startTime * sampleRate));
  const endSample = Math.min(audioBuffer.length, Math.floor(endTime * sampleRate));
  const numSamples = endSample - startSample;

  const buffer = new ArrayBuffer(44 + numSamples * numChannels * 2);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * numChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  view.setUint16(32, numChannels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, numSamples * numChannels * 2, true);

  // Interleave channel samples
  let offset = 44;
  const channelsData = [];
  for (let c = 0; c < numChannels; c++) {
    channelsData.push(audioBuffer.getChannelData(c).subarray(startSample, endSample));
  }

  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, channelsData[c][i] * volume));
      const val = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(offset, val, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}
