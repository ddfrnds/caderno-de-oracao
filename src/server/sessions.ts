import { query } from './db';
import { hashToken, newToken } from './tokens';
import type { User } from './users';

export const SESSION_DAYS = 30;

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await query('insert into sessions (user_id, token_hash, expires_at) values ($1, $2, $3)', [
    userId,
    hashToken(token),
    expiresAt,
  ]);
  return { token, expiresAt };
}

export async function getSessionUser(token: string): Promise<User | null> {
  const { rows } = await query<User>(
    `select u.id, u.name, u.email, u.role from sessions s join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)],
  );
  return rows[0] ?? null;
}

export async function deleteSession(token: string): Promise<void> {
  await query('delete from sessions where token_hash = $1', [hashToken(token)]);
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await query('delete from sessions where user_id = $1', [userId]);
}

export async function purgeExpiredSessions(): Promise<void> {
  await query('delete from sessions where expires_at < now()');
}
