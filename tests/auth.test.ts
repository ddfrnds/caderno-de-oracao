import { describe, expect, it } from 'vitest';
import { query } from '../src/server/db';
import { createSession, deleteSession, getSessionUser } from '../src/server/sessions';
import { createUser, EmailTakenError, TooManyAttemptsError, verifyCredentials } from '../src/server/users';
import { isResetTokenValid, requestPasswordReset, resetPassword } from '../src/server/password-reset';
import { hashToken } from '../src/server/tokens';
import { makeUser } from './helpers';

describe('usuários e login', () => {
  it('armazena senha com hash e impede e-mail duplicado (sem diferenciar maiúsculas)', async () => {
    await createUser({ name: 'Ana Souza', email: 'Ana@Exemplo.com', password: 'minha-senha-1' });
    const { rows } = await query<{ password_hash: string }>('select password_hash from users');
    expect(rows[0].password_hash).not.toContain('minha-senha-1');
    expect(rows[0].password_hash.startsWith('$2')).toBe(true);
    await expect(createUser({ name: 'Outra Ana', email: 'ana@exemplo.com', password: 'outra-senha-1' })).rejects.toBeInstanceOf(EmailTakenError);
  });

  it('valida credenciais e bloqueia após muitas falhas', async () => {
    await createUser({ name: 'Ana Souza', email: 'ana@exemplo.com', password: 'minha-senha-1' });
    expect((await verifyCredentials('ANA@exemplo.com', 'minha-senha-1'))?.email).toBe('ana@exemplo.com');
    expect(await verifyCredentials('ana@exemplo.com', 'errada')).toBeNull();
    expect(await verifyCredentials('nao@existe.com', 'qualquer')).toBeNull();
    for (let i = 0; i < 7; i++) await verifyCredentials('ana@exemplo.com', 'errada');
    await expect(verifyCredentials('ana@exemplo.com', 'minha-senha-1')).rejects.toBeInstanceOf(TooManyAttemptsError);
  });
});

describe('sessões', () => {
  it('guarda apenas o hash do token, expira e pode ser encerrada', async () => {
    const u = await makeUser();
    const { token } = await createSession(u.id);
    const { rows } = await query<{ token_hash: string }>('select token_hash from sessions');
    expect(rows[0].token_hash).toBe(hashToken(token));
    expect(rows[0].token_hash).not.toBe(token);
    expect((await getSessionUser(token))?.id).toBe(u.id);
    await query(`update sessions set expires_at = now() - interval '1 minute'`);
    expect(await getSessionUser(token)).toBeNull();
    const s2 = await createSession(u.id);
    await deleteSession(s2.token);
    expect(await getSessionUser(s2.token)).toBeNull();
    expect(await getSessionUser('token-inventado')).toBeNull();
  });
});

describe('recuperação de senha', () => {
  it('redefine a senha com token de uso único e encerra sessões', async () => {
    const u = await createUser({ name: 'Ana Souza', email: 'ana@exemplo.com', password: 'minha-senha-1' });
    const { token: sess } = await createSession(u.id);
    const logs: string[] = [];
    const orig = console.log;
    console.log = (m: string) => logs.push(String(m));
    await requestPasswordReset('ana@exemplo.com', 'http://localhost:3000');
    console.log = orig;
    const token = /token=([\w-]+)/.exec(logs.join('\n'))?.[1];
    expect(token).toBeTruthy();
    expect(await isResetTokenValid(token!)).toBe(true);
    expect(await resetPassword(token!, 'nova-senha-123')).toBe(true);
    expect(await resetPassword(token!, 'outra-senha-123')).toBe(false);
    expect(await getSessionUser(sess)).toBeNull();
    expect(await verifyCredentials('ana@exemplo.com', 'nova-senha-123')).not.toBeNull();
    expect(await verifyCredentials('ana@exemplo.com', 'minha-senha-1')).toBeNull();
  });
  it('não revela se o e-mail existe e rejeita token expirado', async () => {
    await expect(requestPasswordReset('ninguem@exemplo.com', 'http://x')).resolves.toBeUndefined();
    expect(await resetPassword('token-invalido-123', 'nova-senha-123')).toBe(false);
  });
});
