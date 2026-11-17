import { Pool, type PoolClient, type QueryResultRow } from 'pg';

const g = globalThis as unknown as { __cadernoPool?: Pool };

export function pool(): Pool {
  if (!g.__cadernoPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL não definida');
    g.__cadernoPool = new Pool({ connectionString: url, max: process.env.VERCEL ? 3 : 10 });
  }
  return g.__cadernoPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  return pool().query<T>(text, params);
}

export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}
