import { query, tx } from './db';
import { sendMail } from './mail';
import { hashPassword } from './password';
import { hashToken, newToken } from './tokens';
import { findUserByEmail } from './users';

const RESET_HOURS = 1;

export async function requestPasswordReset(email: string, baseUrl: string): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user) return; // resposta idêntica para não revelar quais e-mails existem
  const token = newToken();
  await tx(async (c) => {
    await c.query('delete from password_resets where user_id = $1 and used_at is null', [user.id]);
    await c.query('insert into password_resets (user_id, token_hash, expires_at) values ($1, $2, $3)', [
      user.id,
      hashToken(token),
      new Date(Date.now() + RESET_HOURS * 3_600_000),
    ]);
  });
  const link = `${baseUrl.replace(/\/$/, '')}/redefinir-senha?token=${token}`;
  await sendMail(
    user.email,
    'Redefinição de senha — Caderno de Oração',
    `Olá, ${user.name}.\n\nPara criar uma nova senha, acesse o link abaixo (válido por ${RESET_HOURS} hora):\n${link}\n\nSe você não pediu a redefinição, ignore esta mensagem.`,
    `<p>Olá, ${escapeHtml(user.name)}.</p><p>Para criar uma nova senha, <a href="${link}">clique aqui</a> (válido por ${RESET_HOURS} hora).</p><p>Se você não pediu a redefinição, ignore esta mensagem.</p>`,
  );
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  const { rows } = await query(
    'select 1 from password_resets where token_hash = $1 and used_at is null and expires_at > now()',
    [hashToken(token)],
  );
  return rows.length > 0;
}

/** Retorna false se o token for inválido/expirado/já usado. Encerra todas as sessões do usuário. */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const hash = await hashPassword(newPassword);
  return tx(async (c) => {
    const { rows } = await c.query<{ id: string; user_id: string }>(
      `update password_resets set used_at = now()
       where token_hash = $1 and used_at is null and expires_at > now() returning id, user_id`,
      [hashToken(token)],
    );
    if (!rows[0]) return false;
    await c.query('update users set password_hash = $1 where id = $2', [hash, rows[0].user_id]);
    await c.query('delete from sessions where user_id = $1', [rows[0].user_id]);
    return true;
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
}
