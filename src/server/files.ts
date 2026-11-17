import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { safeFileName, sniffFile, type Sniffed } from '@/lib/file-sniff';
import { query } from './db';
import { storage } from './storage';
import type { User } from './users';

export const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // limite de corpo das funções da Vercel é 4,5 MB
export const MAX_FILES = 6;

export type FileRow = {
  id: string;
  original_name: string;
  mime: string;
  size: number;
  kind: 'image' | 'document';
  storage_key: string;
  submission_id: string | null;
  prayer_id: string | null;
};

export type ValidatedUpload = { name: string; data: Buffer; sniffed: Sniffed };
export type UploadResult = { ok: true; files: ValidatedUpload[] } | { ok: false; error: string };

/** Valida arquivos de um FormData: ignora campos vazios, confere tamanho e tipo real. */
export async function validateUploads(
  entries: FormDataEntryValue[],
  allow: { images: boolean; documents: boolean } = { images: true, documents: true },
): Promise<UploadResult> {
  const files = entries.filter((e): e is File => typeof e !== 'string' && e.size > 0);
  if (files.length > MAX_FILES) return { ok: false, error: `Envie no máximo ${MAX_FILES} arquivos por vez.` };
  const total = files.reduce((n, f) => n + f.size, 0);
  if (total > MAX_TOTAL_BYTES) return { ok: false, error: 'Os arquivos somam mais de 4 MB. Envie menos arquivos ou reduza o tamanho.' };
  const out: ValidatedUpload[] = [];
  for (const f of files) {
    const data = Buffer.from(await f.arrayBuffer());
    const sniffed = sniffFile(data);
    if (!sniffed) return { ok: false, error: `Tipo de arquivo não permitido: ${safeFileName(f.name)}. Use imagens (JPG, PNG, WEBP, GIF), PDF, DOC, DOCX, ODT, RTF ou TXT.` };
    if (sniffed.kind === 'image' && !allow.images) return { ok: false, error: 'Neste campo envie apenas documentos.' };
    if (sniffed.kind === 'document' && !allow.documents) return { ok: false, error: 'Neste campo envie apenas imagens.' };
    out.push({ name: safeFileName(f.name), data, sniffed });
  }
  return { ok: true, files: out };
}

/** Grava no storage e registra no banco usando o client da transação. Em caso de erro, remove o que foi gravado. */
export async function storeUploads(
  client: PoolClient,
  uploads: ValidatedUpload[],
  owner: { submissionId?: string | null; prayerId?: string | null },
): Promise<FileRow[]> {
  const written: string[] = [];
  const rows: FileRow[] = [];
  try {
    for (const u of uploads) {
      const key = `${randomUUID()}.${u.sniffed.ext}`;
      await storage().put(key, u.data, u.sniffed.mime);
      written.push(key);
      const { rows: r } = await client.query<FileRow>(
        `insert into files (storage_key, original_name, mime, size, kind, submission_id, prayer_id)
         values ($1, $2, $3, $4, $5, $6, $7)
         returning id, original_name, mime, size, kind, storage_key, submission_id, prayer_id`,
        [key, u.name, u.sniffed.mime, u.data.length, u.sniffed.kind, owner.submissionId ?? null, owner.prayerId ?? null],
      );
      rows.push(r[0]);
    }
  } catch (err) {
    await Promise.all(written.map((k) => storage().remove(k).catch(() => {})));
    throw err;
  }
  return rows;
}

export async function removeStoredKeys(keys: string[]): Promise<void> {
  await Promise.all(keys.map((k) => storage().remove(k).catch(() => {})));
}

/** Regra de acesso: admin; dono do envio; ou público se o arquivo pertence a uma oração publicada. */
export async function getFileForViewer(fileId: string, viewer: User | null): Promise<FileRow | null> {
  if (!/^[0-9a-f-]{36}$/.test(fileId)) return null;
  const { rows } = await query<FileRow & { owner_id: string | null; is_public: boolean }>(
    `select f.id, f.original_name, f.mime, f.size, f.kind, f.storage_key, f.submission_id, f.prayer_id,
            s.user_id as owner_id,
            exists (select 1 from prayers p where p.published and (p.id = f.prayer_id or p.cover_file_id = f.id)) as is_public
     from files f left join submissions s on s.id = f.submission_id
     where f.id = $1`,
    [fileId],
  );
  const f = rows[0];
  if (!f) return null;
  if (f.is_public) return f;
  if (!viewer) return null;
  if (viewer.role === 'admin') return f;
  if (f.owner_id && f.owner_id === viewer.id) return f;
  return null;
}
