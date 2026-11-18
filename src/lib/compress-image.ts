const MAX_SIDE = 1600;
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Reduz a foto no navegador antes do envio (máx. 1600 px, WebP/JPEG ~80%). Falhas devolvem o arquivo original. */
export async function compressImage(file: File): Promise<File> {
  if (!TYPES.has(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 150 * 1024) { bmp.close(); return file; }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.8));
    if (!blob || blob.type !== 'image/webp' || (scale === 1 && blob.size >= file.size)) return file;
    return new File([blob], file.name.replace(/\.[^.]*$/, '') + '.webp', { type: 'image/webp', lastModified: Date.now() });
  } catch {
    return file;
  }
}

export const formatSize = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
