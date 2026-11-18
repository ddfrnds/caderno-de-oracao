import { rmSync } from 'node:fs';
import { Pool } from 'pg';
import { runMigrations } from '../src/server/migrate';

export default async function setup() {
  rmSync('.data/test-uploads', { recursive: true, force: true });
  const url = process.env.TEST_DATABASE_URL ?? 'postgres://postgres@localhost:5433/caderno_test';
  process.env.DATABASE_URL = url;
  const p = new Pool({ connectionString: url });
  await p.query('drop schema public cascade; create schema public;');
  await p.end();
  await runMigrations();
  const { pool } = await import('../src/server/db');
  await pool().end();
}
