import { query, tx } from './db';
import { removeStoredKeys, storeUploads, type FileRow, type ValidatedUpload } from './files';
import { createDraftPrayerFromSubmission } from './prayers';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export type SubmissionListItem = {
  id: string;
  title: string | null;
  excerpt: string | null;
  status: SubmissionStatus;
  created_at: Date;
  user_name: string;
  user_email: string;
  file_count: number;
  prayer_id: string | null;
  prayer_published: boolean | null;
};

export class EmptySubmissionError extends Error {
  constructor() {
    super('EMPTY_SUBMISSION');
  }
}
export class PrayerExistsError extends Error {
  constructor() {
    super('PRAYER_EXISTS');
  }
}

export async function createSubmission(input: {
  userId: string;
  title?: string;
  body?: string;
  uploads: ValidatedUpload[];
}): Promise<string> {
  const body = input.body?.trim() || null;
  const title = input.title?.trim() || null;
  if (!body && input.uploads.length === 0) throw new EmptySubmissionError();
  return tx(async (c) => {
    const { rows } = await c.query<{ id: string }>(
      `insert into submissions (user_id, title, body) values ($1, $2, $3) returning id`,
      [input.userId, title, body],
    );
    await storeUploads(c, input.uploads, { submissionId: rows[0].id });
    return rows[0].id;
  });
}

export async function listSubmissions(status?: SubmissionStatus): Promise<SubmissionListItem[]> {
  const { rows } = await query<SubmissionListItem>(
    `select s.id, s.title, left(s.body, 160) as excerpt, s.status, s.created_at,
            u.name as user_name, u.email as user_email,
            (select count(*)::int from files f where f.submission_id = s.id) as file_count,
            p.id as prayer_id, p.published as prayer_published
     from submissions s join users u on u.id = s.user_id left join prayers p on p.submission_id = s.id
     where ($1::text is null or s.status = $1)
     order by s.created_at desc`,
    [status ?? null],
  );
  return rows;
}

export async function countByStatus(): Promise<Record<SubmissionStatus, number>> {
  const { rows } = await query<{ status: SubmissionStatus; n: number }>(
    'select status, count(*)::int as n from submissions group by status',
  );
  const out = { pending: 0, approved: 0, rejected: 0 };
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export type SubmissionDetail = {
  id: string;
  title: string | null;
  body: string | null;
  status: SubmissionStatus;
  created_at: Date;
  reviewed_at: Date | null;
  user_id: string;
  user_name: string;
  user_email: string;
  files: FileRow[];
  prayer_id: string | null;
};

export async function getSubmission(id: string): Promise<SubmissionDetail | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { rows } = await query<Omit<SubmissionDetail, 'files'>>(
    `select s.id, s.title, s.body, s.status, s.created_at, s.reviewed_at, s.user_id,
            u.name as user_name, u.email as user_email, p.id as prayer_id
     from submissions s join users u on u.id = s.user_id left join prayers p on p.submission_id = s.id
     where s.id = $1`,
    [id],
  );
  if (!rows[0]) return null;
  const files = await query<FileRow>(
    `select id, original_name, mime, size, kind, storage_key, submission_id, prayer_id
     from files where submission_id = $1 order by created_at`,
    [id],
  );
  return { ...rows[0], files: files.rows };
}

/** Aprova e cria o rascunho da oração (NÃO publica: o administrador edita fonte/fundo e publica). */
export async function approveSubmission(id: string, adminId: string): Promise<string> {
  return tx(async (c) => {
    const { rows } = await c.query<{ id: string; title: string | null; body: string | null }>(
      `update submissions set status = 'approved', reviewed_at = now(), reviewed_by = $2
       where id = $1 returning id, title, body`,
      [id, adminId],
    );
    if (!rows[0]) throw new Error('NOT_FOUND');
    return createDraftPrayerFromSubmission(c, rows[0]);
  });
}

export async function rejectSubmission(id: string, adminId: string): Promise<void> {
  await tx(async (c) => {
    const r = await c.query(
      `update submissions set status = 'rejected', reviewed_at = now(), reviewed_by = $2 where id = $1`,
      [id, adminId],
    );
    if (r.rowCount === 0) throw new Error('NOT_FOUND');
    // se já havia uma oração derivada, ela deixa de ser pública
    await c.query(`update prayers set published = false, updated_at = now() where submission_id = $1`, [id]);
  });
}

export async function deleteSubmission(id: string): Promise<void> {
  const keys = await tx(async (c) => {
    const prayer = await c.query('select 1 from prayers where submission_id = $1', [id]);
    if (prayer.rowCount) throw new PrayerExistsError();
    const files = await c.query<{ storage_key: string }>('select storage_key from files where submission_id = $1', [id]);
    await c.query('delete from submissions where id = $1', [id]);
    return files.rows.map((f) => f.storage_key);
  });
  await removeStoredKeys(keys);
}

export async function listUserSubmissions(userId: string) {
  const { rows } = await query<{ id: string; title: string | null; status: SubmissionStatus; created_at: Date }>(
    'select id, title, status, created_at from submissions where user_id = $1 order by created_at desc limit 20',
    [userId],
  );
  return rows;
}
