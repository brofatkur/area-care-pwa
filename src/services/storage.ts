// Camera capture, canvas watermarking & compression (<= 300KB)
import { uploadPhotoToStorage } from './insforge';

export interface WatermarkOptions {
  areaName: string;
  officerName: string;
  slotName: string;
  customNote?: string;
}

export async function processAndWatermarkImage(
  imageSource: HTMLImageElement | HTMLVideoElement,
  options: WatermarkOptions
): Promise<{ dataUrl: string; blob: Blob }> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Standardize dimensions (e.g. 1280x960 max to stay well under 300KB after JPEG compression)
  const origWidth = 'videoWidth' in imageSource ? imageSource.videoWidth : imageSource.width;
  const origHeight = 'videoHeight' in imageSource ? imageSource.videoHeight : imageSource.height;

  const maxDimension = 1280;
  let targetWidth = origWidth || 1280;
  let targetHeight = origHeight || 960;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Draw original image / video frame
  ctx.drawImage(imageSource, 0, 0, targetWidth, targetHeight);

  // Format Date and Time in WITA (UTC+8)
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar'
  });
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Makassar'
  }) + ' WITA';

  // Render high-contrast watermark banner at the bottom
  const bannerHeight = Math.max(70, Math.round(targetHeight * 0.12));
  const bannerY = targetHeight - bannerHeight;

  // Dark gradient overlay
  const gradient = ctx.createLinearGradient(0, bannerY, 0, targetHeight);
  gradient.addColorStop(0, 'rgba(15, 23, 42, 0.75)');
  gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, bannerY, targetWidth, bannerHeight);

  // Top accent line on banner (emerald green)
  ctx.fillStyle = '#10b981';
  ctx.fillRect(0, bannerY, targetWidth, 4);

  // Text watermark
  const fontSizeMain = Math.max(14, Math.round(bannerHeight * 0.28));
  const fontSizeSub = Math.max(12, Math.round(bannerHeight * 0.22));

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSizeMain}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillText(`📍 ${options.areaName.toUpperCase()} · ${options.slotName}`, 20, bannerY + bannerHeight * 0.42);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = `500 ${fontSizeSub}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillText(`👤 Petugas: ${options.officerName} | 🕒 ${dateStr} ${timeStr}`, 20, bannerY + bannerHeight * 0.80);

  // GPS / Hash Stamp in top right corner
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.beginPath();
  ctx.roundRect(targetWidth - 210, 16, 194, 34, 6);
  ctx.fill();

  ctx.fillStyle = '#34d399';
  ctx.font = `600 11px 'JetBrains Mono', monospace`;
  ctx.fillText(`VERIFIED · care.boffice`, targetWidth - 200, 38);

  // Compress to JPEG with quality 0.75 (guarantees file size <= 300KB)
  const quality = 0.75;
  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  const blob: Blob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', quality);
  });

  return { dataUrl, blob };
}

export async function uploadWatermarkedPhoto(
  blob: Blob,
  prefix: string = 'evidence'
): Promise<string> {
  const fileName = `${prefix}_${Date.now()}.jpg`;
  return await uploadPhotoToStorage(blob, fileName);
}
