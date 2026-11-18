export type Sniffed = { mime: string; ext: string; kind: 'image' | 'document' };

const startsWith = (buf: Uint8Array, bytes: number[], offset = 0) => bytes.every((b, i) => buf[offset + i] === b);

/** Identifica o tipo real pelo conteúdo (não confia em nome/Content-Type enviados pelo cliente). */
export function sniffFile(buf: Uint8Array): Sniffed | null {
  if (buf.length < 4) return null;
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg', kind: 'image' };
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: 'image/png', ext: 'png', kind: 'image' };
  if (startsWith(buf, [0x47, 0x49, 0x46, 0x38])) return { mime: 'image/gif', ext: 'gif', kind: 'image' };
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8))
    return { mime: 'image/webp', ext: 'webp', kind: 'image' };
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46])) return { mime: 'application/pdf', ext: 'pdf', kind: 'document' };
  if (startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
    return { mime: 'application/msword', ext: 'doc', kind: 'document' };
  if (startsWith(buf, [0x7b, 0x5c, 0x72, 0x74, 0x66])) return { mime: 'application/rtf', ext: 'rtf', kind: 'document' };
  if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04])) {
    const latin = Buffer.from(buf).toString('latin1');
    if (latin.includes('word/')) {
      return {
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ext: 'docx',
        kind: 'document',
      };
    }
    if (latin.includes('application/vnd.oasis.opendocument.text'))
      return { mime: 'application/vnd.oasis.opendocument.text', ext: 'odt', kind: 'document' };
    return null;
  }
  // texto puro: sem bytes nulos e UTF-8 válido
  const sample = buf.subarray(0, 8000);
  if (!sample.includes(0)) {
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(sample);
      return { mime: 'text/plain; charset=utf-8', ext: 'txt', kind: 'document' };
    } catch {
      /* não é utf-8 */
    }
  }
  return null;
}

export function safeFileName(name: string): string {
  const base = name.replace(/[\\/\u0000-\u001f"<>|?*:]+/g, '_').trim().slice(0, 120);
  return base || 'arquivo';
}
