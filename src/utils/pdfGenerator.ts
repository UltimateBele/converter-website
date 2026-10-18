import { PDFDocument, degrees } from 'pdf-lib';

export interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  width?: number;
  height?: number;
  rotation: number; // 0, 90, 180, 270
}

export interface PdfGenerationOptions {
  pageSize: 'fit' | 'a4' | 'letter';
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: 'none' | 'small' | 'normal' | 'large';
  fit: 'contain' | 'cover';
  quality: 'lossless' | 'high' | 'compact';
  onProgress?: (progress: number) => void;
}

// Points (72 points = 1 inch)
const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612.0, height: 792.0 },
};

const MARGIN_VALUES = {
  none: 0,
  small: 20,
  normal: 40,
  large: 60,
};

/**
 * Loads an image into an HTMLImageElement and optionally renders through canvas for rotation, compression, or format normalization
 */
async function processImageForPdf(
  item: ImageItem,
  qualityMode: 'lossless' | 'high' | 'compact'
): Promise<{ bytes: Uint8Array; format: 'jpg' | 'png'; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      const isPngOriginal = item.file.type === 'image/png';
      const isJpegOriginal = item.file.type === 'image/jpeg' || item.file.type === 'image/jpg';
      const needsRotation = item.rotation % 360 !== 0;
      const needsCompression = qualityMode !== 'lossless';

      // Direct embed if no rotation, no compression needed, and already standard JPG/PNG
      if (!needsRotation && !needsCompression && (isPngOriginal || isJpegOriginal)) {
        const buffer = await item.file.arrayBuffer();
        resolve({
          bytes: new Uint8Array(buffer),
          format: isJpegOriginal ? 'jpg' : 'png',
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        return;
      }

      // Otherwise draw to canvas to handle rotation, WebP/SVG conversion, and compression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      const rot = (item.rotation % 360 + 360) % 360;
      const isRotated90or270 = rot === 90 || rot === 270;

      canvas.width = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
      canvas.height = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();

      const quality = qualityMode === 'compact' ? 0.65 : qualityMode === 'high' ? 0.85 : 0.95;
      const mimeType = (isPngOriginal && qualityMode === 'lossless') ? 'image/png' : 'image/jpeg';

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob from canvas'));
            return;
          }
          const buffer = await blob.arrayBuffer();
          resolve({
            bytes: new Uint8Array(buffer),
            format: mimeType === 'image/jpeg' ? 'jpg' : 'png',
            width: canvas.width,
            height: canvas.height,
          });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${item.name}`));
    };

    img.src = item.previewUrl;
  });
}

/**
 * Generates a PDF from an array of ImageItems with custom layout settings
 */
export async function generatePdfFromImages(
  images: ImageItem[],
  options: PdfGenerationOptions
): Promise<Blob> {
  if (images.length === 0) {
    throw new Error('Please add at least one image to create a PDF.');
  }

  const pdfDoc = await PDFDocument.create();
  const marginPt = MARGIN_VALUES[options.margin];

  for (let index = 0; index < images.length; index++) {
    const item = images[index];
    const { bytes, format, width: imgWidth, height: imgHeight } = await processImageForPdf(
      item,
      options.quality
    );

    const embeddedImage = format === 'jpg'
      ? await pdfDoc.embedJpg(bytes)
      : await pdfDoc.embedPng(bytes);

    let pageWidth = 0;
    let pageHeight = 0;

    if (options.pageSize === 'fit') {
      // Fit page to image size plus margins
      pageWidth = imgWidth + marginPt * 2;
      pageHeight = imgHeight + marginPt * 2;
    } else {
      const base = PAGE_SIZES[options.pageSize];
      let isLandscape = false;

      if (options.orientation === 'auto') {
        isLandscape = imgWidth > imgHeight;
      } else if (options.orientation === 'landscape') {
        isLandscape = true;
      }

      pageWidth = isLandscape ? Math.max(base.width, base.height) : Math.min(base.width, base.height);
      pageHeight = isLandscape ? Math.min(base.width, base.height) : Math.max(base.width, base.height);
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Usable print box
    const usableWidth = Math.max(10, pageWidth - marginPt * 2);
    const usableHeight = Math.max(10, pageHeight - marginPt * 2);

    let drawWidth = usableWidth;
    let drawHeight = usableHeight;
    let drawX = marginPt;
    let drawY = marginPt;

    const imgAspect = imgWidth / imgHeight;
    const boxAspect = usableWidth / usableHeight;

    if (options.fit === 'contain') {
      if (imgAspect > boxAspect) {
        // Image is wider than printable area
        drawWidth = usableWidth;
        drawHeight = usableWidth / imgAspect;
        drawX = marginPt;
        drawY = marginPt + (usableHeight - drawHeight) / 2;
      } else {
        // Image is taller than printable area
        drawHeight = usableHeight;
        drawWidth = usableHeight * imgAspect;
        drawX = marginPt + (usableWidth - drawWidth) / 2;
        drawY = marginPt;
      }
    } else {
      // Cover (fills printable box)
      if (imgAspect > boxAspect) {
        drawHeight = usableHeight;
        drawWidth = usableHeight * imgAspect;
        drawX = marginPt - (drawWidth - usableWidth) / 2;
        drawY = marginPt;
      } else {
        drawWidth = usableWidth;
        drawHeight = usableWidth / imgAspect;
        drawX = marginPt;
        drawY = marginPt - (drawHeight - usableHeight) / 2;
      }
    }

    page.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });

    const progress = Math.round(((index + 1) / images.length) * 100);
    options.onProgress?.(progress);
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}
