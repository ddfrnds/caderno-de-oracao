import { createReadStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

export type StoredObject = { stream: ReadableStream<Uint8Array>; size: number };

export interface Storage {
  put(key: string, data: Buffer, mime: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  remove(key: string): Promise<void>;
}

const KEY_RE = /^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/;
function assertKey(key: string) {
  if (!KEY_RE.test(key)) throw new Error('Chave de armazenamento inválida');
}

function localStorageDriver(): Storage {
  const base = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? '.data/uploads');
  const full = (key: string) => {
    assertKey(key);
    const p = path.join(base, key);
    if (!p.startsWith(base + path.sep)) throw new Error('Caminho inválido');
    return p;
  };
  return {
    async put(key, data) {
      await mkdir(/*turbopackIgnore: true*/ base, { recursive: true });
      await writeFile(/*turbopackIgnore: true*/ full(key), data, { flag: 'wx' });
    },
    async get(key) {
      const p = full(key);
      const s = await stat(/*turbopackIgnore: true*/ p).catch(() => null);
      if (!s) return null;
      return { stream: Readable.toWeb(createReadStream(/*turbopackIgnore: true*/ p)) as ReadableStream<Uint8Array>, size: s.size };
    },
    async remove(key) {
      await rm(/*turbopackIgnore: true*/ full(key), { force: true });
    },
  };
}

function blobDriver(): Storage {
  const pathname = (key: string) => {
    assertKey(key);
    return `uploads/${key}`;
  };
  return {
    async put(key, data, mime) {
      const { put } = await import('@vercel/blob');
      await put(pathname(key), data, { access: 'private', contentType: mime, addRandomSuffix: false });
    },
    async get(key) {
      const { get } = await import('@vercel/blob');
      const res = await get(pathname(key), { access: 'private' });
      if (!res || res.statusCode !== 200) return null;
      return { stream: res.stream, size: res.blob.size };
    },
    async remove(key) {
      const { del } = await import('@vercel/blob');
      await del(pathname(key));
    },
  };
}

let cached: Storage | null = null;
export function storage(): Storage {
  if (!cached) {
    const driver = process.env.STORAGE_DRIVER ?? (process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : 'local');
    cached = driver === 'blob' ? blobDriver() : localStorageDriver();
  }
  return cached;
}

export function resetStorageForTests() {
  cached = null;
}
