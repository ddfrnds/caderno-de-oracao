import sharp from 'sharp';
import type { Sniffed } from '@/lib/file-sniff';

export const MAX_IMAGE_SIDE = 1600;
const SKIP_BELOW_BYTES = 150 * 1024;

export type Optimized = { data: Buffer; sniffed: Sniffed; changed: boolean };

/** Reduz fotos grandes: máx. 1600 px no maior lado, WebP qualidade 80, sem metadados (EXIF/GPS). GIFs e imagens já pequenas ficam como estão. */
export async function optimizeImage(data: Buffer, sniffed: Sniffed): Promise<Optimized> {
  const same = { data, sniffed, changed: false };
  if (sniffed.kind !== 'image' || sniffed.ext === 'gif') return same;
  try {
    const meta = await sharp(data, { failOn: 'none' }).metadata();
    const big = (meta.width ?? 0) > MAX_IMAGE_SIDE || (meta.height ?? 0) > MAX_IMAGE_SIDE;
    if (!big && data.length <= SKIP_BELOW_BYTES) return same;
    const out = await sharp(data, { failOn: 'none' })
      .rotate()
      .resize({ width: MAX_IMAGE_SIDE, height: MAX_IMAGE_SIDE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    if (!big && out.length >= data.length) return same;
    return { data: out, sniffed: { mime: 'image/webp', ext: 'webp', kind: 'image' }, changed: true };
  } catch {
    return same; // se não der para processar, mantém o original (já validado pelo tipo)
  }
}
