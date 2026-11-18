import type { PoolClient } from 'pg';
import { slugify } from '@/lib/slug';
import { query, tx } from './db';
import { removeStoredKeys, storeUploads, type FileRow, type ValidatedUpload } from './files';

export type Prayer = {
  id: string;
  submission_id: string | null;
  slug: string;
  title: string;
  body: string;
  cover_file_id: string | null;
  font: string;
  background: string;
  published: boolean;
  published_at: Date | null;
  created_at: Date;
};

const COLS = 'id, submission_id, slug, title, body, cover_file_id, font, background, published, published_at, created_at';

async function uniqueSlug(c: { query: PoolClient['query'] }, title: string): Promise<string> {
  const base = slugify(title);
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const r = await c.query('select 1 from prayers where slug = $1', [candidate]);
    if (!r.rowCount) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function createDraftPrayerFromSubmission(
  c: PoolClient,
  s: { id: string; title: string | null; body: string | null },
): Promise<string> {
  const existing = await c.query<{ id: string }>('select id from prayers where submission_id = $1', [s.id]);
  if (existing.rows[0]) return existing.rows[0].id;
  const title = s.title?.trim() || 'Oração sem título';
  const slug = await uniqueSlug(c, title);
  const { rows } = await c.query<{ id: string }>(
    `insert into prayers (submission_id, slug, title, body) values ($1, $2, $3, $4) returning id`,
    [s.id, slug, title, s.body ?? ''],
  );
  // imagem do envio vira capa padrão (o administrador pode trocar)
  const cover = await c.query<{ id: string }>(
    `select id from files where submission_id = $1 and kind = 'image' order by created_at limit 1`,
    [s.id],
  );
  if (cover.rows[0]) await c.query('update prayers set cover_file_id = $1 where id = $2', [cover.rows[0].id, rows[0].id]);
  return rows[0].id;
}

export type PrayerCard = Pick<Prayer, 'id' | 'slug' | 'title' | 'cover_file_id' | 'published_at'>;

export async function listPublishedPrayers(): Promise<PrayerCard[]> {
  const { rows } = await query<PrayerCard>(
    `select id, slug, title, cover_file_id, published_at from prayers
     where published order by published_at desc, created_at desc`,
  );
  return rows;
}

export async function getPublishedPrayerBySlug(slug: string): Promise<(Prayer & { files: FileRow[] }) | null> {
  const { rows } = await query<Prayer>(`select ${COLS} from prayers where slug = $1 and published`, [slug]);
  if (!rows[0]) return null;
  const files = await query<FileRow>(
    `select id, original_name, mime, size, kind, storage_key, submission_id, prayer_id
     from files where prayer_id = $1 and id is distinct from $2 order by created_at`,
    [rows[0].id, rows[0].cover_file_id],
  );
  return { ...rows[0], files: files.rows };
}

export type PrayerListItem = Pick<Prayer, 'id' | 'title' | 'published' | 'published_at' | 'submission_id' | 'created_at'>;

export async function listAllPrayers(): Promise<PrayerListItem[]> {
  const { rows } = await query<PrayerListItem>(
    'select id, title, published, published_at, submission_id, created_at from prayers order by created_at desc',
  );
  return rows;
}

export type PrayerEditorData = Prayer & {
  files: FileRow[]; // arquivos disponíveis: do envio de origem + enviados direto à oração
  included: Set<string>;
};

export async function findPrayerBySlug(slug: string): Promise<Prayer | null> {
  const { rows } = await query<Prayer>(`select ${COLS} from prayers where slug = $1`, [slug]);
  return rows[0] ?? null;
}

export async function getPrayerForEditor(id: string): Promise<PrayerEditorData | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { rows } = await query<Prayer>(`select ${COLS} from prayers where id = $1`, [id]);
  const p = rows[0];
  if (!p) return null;
  const files = await query<FileRow>(
    `select id, original_name, mime, size, kind, storage_key, submission_id, prayer_id from files
     where prayer_id = $1 or ($2::uuid is not null and submission_id = $2) order by created_at`,
    [p.id, p.submission_id],
  );
  const included = new Set(files.rows.filter((f) => f.prayer_id === p.id).map((f) => f.id));
  return { ...p, files: files.rows, included };
}

export type PrayerInput = {
  title: string;
  body: string;
  font: string;
  background: string;
  coverFileId?: string | null;
  includeFileIds?: string[];
  slug?: string; // só na criação
  publish?: boolean;
  uploads?: ValidatedUpload[]; // arquivos extras enviados pelo administrador
  coverUpload?: ValidatedUpload | null;
};

/** Cria uma oração diretamente pelo administrador (sem envio de usuário). */
export async function createPrayer(input: PrayerInput): Promise<string> {
  return tx(async (c) => {
    const slug = await uniqueSlug(c, input.slug ?? input.title);
    const { rows } = await c.query<{ id: string }>(
      `insert into prayers (slug, title, body, font, background) values ($1, $2, $3, $4, $5) returning id`,
      [slug, input.title.trim(), input.body, input.font, input.background],
    );
    await applyPrayerUpdate(c, rows[0].id, null, input);
    return rows[0].id;
  });
}

export async function updatePrayer(id: string, input: PrayerInput): Promise<void> {
  await tx(async (c) => {
    const { rows } = await c.query<{ submission_id: string | null }>(
      'select submission_id from prayers where id = $1 for update',
      [id],
    );
    if (!rows[0]) throw new Error('NOT_FOUND');
    await applyPrayerUpdate(c, id, rows[0].submission_id, input);
  });
}

async function applyPrayerUpdate(c: PoolClient, id: string, submissionId: string | null, input: PrayerInput) {
  const newFiles = input.uploads?.length ? await storeUploads(c, input.uploads, { prayerId: id }) : [];
  let coverId = input.coverFileId ?? null;
  if (input.coverUpload) {
    const [cover] = await storeUploads(c, [input.coverUpload], { prayerId: id });
    coverId = cover.id;
  }
  // arquivos permitidos: os do envio de origem ou já da oração
  const allowed = await c.query<{ id: string; kind: string; prayer_id: string | null; submission_id: string | null }>(
    `select id, kind, prayer_id, submission_id from files where prayer_id = $1 or ($2::uuid is not null and submission_id = $2)`,
    [id, submissionId],
  );
  const allowedIds = new Map(allowed.rows.map((f) => [f.id, f]));
  if (coverId) {
    const f = allowedIds.get(coverId);
    if (!f || f.kind !== 'image') coverId = null;
    else if (f.prayer_id !== id) await c.query('update files set prayer_id = $1 where id = $2', [id, coverId]);
  }
  if (input.includeFileIds) {
    const include = new Set(input.includeFileIds.filter((f) => allowedIds.has(f)));
    for (const f of newFiles) include.add(f.id);
    for (const f of allowed.rows) {
      if (f.id === coverId) continue;
      const shouldInclude = include.has(f.id);
      if (shouldInclude && f.prayer_id !== id) await c.query('update files set prayer_id = $1 where id = $2', [id, f.id]);
      // desvincula apenas arquivos que vieram de envio (os enviados direto à oração permanecem)
      if (!shouldInclude && f.prayer_id === id && f.submission_id) await c.query('update files set prayer_id = null where id = $1', [f.id]);
    }
  }
  await c.query(
    `update prayers set title = $2, body = $3, font = $4, background = $5, cover_file_id = $6, updated_at = now() where id = $1`,
    [id, input.title.trim(), input.body, input.font, input.background, coverId],
  );
  if (input.publish !== undefined) await setPublishedTx(c, id, input.publish);
}

async function setPublishedTx(c: PoolClient, id: string, publish: boolean) {
  await c.query(
    `update prayers set published = $2, published_at = case when $2 then coalesce(published_at, now()) else published_at end,
     updated_at = now() where id = $1`,
    [id, publish],
  );
}

export async function setPublished(id: string, publish: boolean): Promise<void> {
  await tx((c) => setPublishedTx(c, id, publish));
}

export async function deletePrayer(id: string): Promise<void> {
  const keys = await tx(async (c) => {
    // arquivos enviados direto à oração são apagados; os que vieram de um envio apenas voltam a ele
    const own = await c.query<{ storage_key: string }>(
      'select storage_key from files where prayer_id = $1 and submission_id is null',
      [id],
    );
    await c.query('update prayers set cover_file_id = null where id = $1', [id]);
    await c.query('delete from files where prayer_id = $1 and submission_id is null', [id]);
    await c.query('update files set prayer_id = null where prayer_id = $1', [id]);
    await c.query('delete from prayers where id = $1', [id]);
    return own.rows.map((r) => r.storage_key);
  });
  await removeStoredKeys(keys);
}
