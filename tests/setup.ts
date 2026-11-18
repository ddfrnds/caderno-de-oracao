import { afterAll, beforeEach } from 'vitest';
import { pool } from '../src/server/db';

beforeEach(async () => {
  await pool().query(
    'truncate table files, prayers, submissions, password_resets, sessions, login_attempts, users restart identity cascade',
  );
});
afterAll(async () => {
  await pool().end();
  (globalThis as { __cadernoPool?: unknown }).__cadernoPool = undefined;
});
