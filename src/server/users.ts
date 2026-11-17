import { isUniqueViolation, query } from './db';
import { hashPassword, verifyPassword } from './password';

export type User = { id: string; name: string; email: string; role: 'user' | 'admin' };
type UserRow = User & { password_hash: string };

export class EmailTakenError extends Error {
  constructor() {
    super('EMAIL_TAKEN');
  }
}
export class TooManyAttemptsError extends Error {
  constructor() {
    super('TOO_MANY_ATTEMPTS');
  }
}

const MAX_FAILURES = 8;
const WINDOW_MINUTES = 15;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}): Promise<User> {
  const hash = await hashPassword(input.password);
  try {
    const { rows } = await query<User>(
      'insert into users (name, email, password_hash, role) values ($1, $2, $3, $4) returning id, name, email, role',
      [input.name.trim(), normalizeEmail(input.email), hash, input.role ?? 'user'],
    );
    return rows[0];
  } catch (err) {
    if (isUniqueViolation(err)) throw new EmailTakenError();
    throw err;
  }
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await query<UserRow>(
    'select id, name, email, role, password_hash from users where lower(email) = $1',
    [normalizeEmail(email)],
  );
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const { rows } = await query<User>('select id, name, email, role from users where id = $1', [id]);
  return rows[0] ?? null;
}

/** Retorna o usuário se as credenciais forem válidas; null caso contrário. Limita tentativas por e-mail. */
export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const normalized = normalizeEmail(email);
  const { rows } = await query<{ n: string }>(
    `select count(*) as n from login_attempts where lower(email) = $1 and created_at > now() - ($2 || ' minutes')::interval`,
    [normalized, String(WINDOW_MINUTES)],
  );
  if (Number(rows[0].n) >= MAX_FAILURES) throw new TooManyAttemptsError();

  const user = await findUserByEmail(normalized);
  const ok = await verifyPassword(password, user?.password_hash ?? null);
  if (!ok || !user) {
    await query('insert into login_attempts (email) values ($1)', [normalized]);
    return null;
  }
  await query('delete from login_attempts where lower(email) = $1', [normalized]);
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function setUserPassword(userId: string, password: string): Promise<void> {
  await query('update users set password_hash = $1 where id = $2', [await hashPassword(password), userId]);
}
