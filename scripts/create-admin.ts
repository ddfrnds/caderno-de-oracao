import { config } from 'dotenv';
config({ path: '.env.local' });
config();
import { pool } from '../src/server/db';
import { createUser, findUserByEmail } from '../src/server/users';
import { hashPassword } from '../src/server/password';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? 'Administrador';
  if (!email || !password) throw new Error('Defina ADMIN_EMAIL e ADMIN_PASSWORD (e opcionalmente ADMIN_NAME).');
  if (password.length < 8) throw new Error('ADMIN_PASSWORD precisa ter ao menos 8 caracteres.');
  const existing = await findUserByEmail(email);
  if (existing) {
    await pool().query('update users set role = $1, password_hash = $2 where id = $3', [
      'admin',
      await hashPassword(password),
      existing.id,
    ]);
    console.log(`Usuário ${email} promovido a administrador e senha atualizada.`);
  } else {
    await createUser({ name, email, password, role: 'admin' });
    console.log(`Administrador ${email} criado.`);
  }
  await pool().end();
}
main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
