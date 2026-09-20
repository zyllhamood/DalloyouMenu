/**
 * Shrinks a photo in the browser before it is uploaded.
 *
 * Phone cameras produce 2–5 MB files; pushing those over a mobile connection
 * is what made product saves fail. The storefront never serves anything wider
 * than 1280px (see the thumbnail endpoint), so a 1600px WebP is already more
 * than enough quality and uploads in a fraction of the time.
 *
 * Anything unexpected (an odd format, a browser without WebP encoding) falls
 * back to the original file — shrinking is an optimisation, never a barrier.
 */

const MAX_EDGE = 1600;
const QUALITY = 0.86;
/** Files at or below this are left alone. */
const SMALL_ENOUGH = 500 * 1024;

export interface PreparedImage {
  file: File;
  /** Bytes saved versus the original (0 when untouched). */
  saved: number;
}

function withExtension(name: string, extension: string): string {
  const stem = name.replace(/\.[^./\\]+$/, '') || 'photo';
  return `${stem}.${extension}`;
}

export async function prepareImageForUpload(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return { file, saved: 0 };
  }

  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= SMALL_ENOUGH) return { file, saved: 0 };

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return { file, saved: 0 };
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    // WebP keeps transparency, so cut-outs survive the round trip.
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', QUALITY),
    );
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return { file, saved: 0 };

    const prepared = new File([blob], withExtension(file.name, 'webp'), {
      type: 'image/webp',
      lastModified: Date.now(),
    });
    return { file: prepared, saved: file.size - prepared.size };
  } catch {
    return { file, saved: 0 };
  } finally {
    bitmap?.close?.();
  }
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
