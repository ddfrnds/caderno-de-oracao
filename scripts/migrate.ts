import { config } from 'dotenv';
config({ path: '.env.local' });
config();
import { runMigrations } from '../src/server/migrate';
import { pool } from '../src/server/db';

runMigrations()
  .then((applied) => {
    console.log(applied.length ? `Migrações aplicadas: ${applied.join(', ')}` : 'Banco já está atualizado.');
    return pool().end();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
