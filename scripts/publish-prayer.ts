/**
 * Publica (ou atualiza) a "Meditação sobre as 15 chagas secretas de Cristo - Santa Brígida"
 * a partir de content/meditacao-15-chagas.txt, usando a capa do crucifixo.
 * Uso: npm run seed:prayer   (usa DATABASE_URL e o storage configurados no ambiente)
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config();
import { readFile } from 'node:fs/promises';
import { sniffFile } from '../src/lib/file-sniff';
import { pool } from '../src/server/db';
import { createPrayer, findPrayerBySlug, updatePrayer, type PrayerInput } from '../src/server/prayers';

const SLUG = 'meditacao-15-chagas-secretas-de-cristo';
const TITLE = 'Meditação sobre as 15 chagas secretas de Cristo - Santa Brígida';

async function main() {
  const body = (await readFile('content/meditacao-15-chagas.txt', 'utf8')).trim();
  const coverData = await readFile('assets-src/capa-crucifixo.jpg');
  const sniffed = sniffFile(coverData);
  if (!sniffed) throw new Error('Capa inválida');

  const existing = await findPrayerBySlug(SLUG);
  const base: PrayerInput = { title: TITLE, body, font: 'garamond', background: 'borgonha', publish: true };
  if (!existing) {
    await createPrayer({ ...base, slug: SLUG, coverUpload: { name: 'capa-crucifixo.jpg', data: coverData, sniffed } });
    console.log('Oração criada e publicada.');
  } else {
    await updatePrayer(existing.id, { ...base, coverFileId: existing.cover_file_id, ...(existing.cover_file_id ? {} : { coverUpload: { name: 'capa-crucifixo.jpg', data: coverData, sniffed } }) });
    console.log('Oração atualizada.');
  }
  await pool().end();
}
main().catch((e) => { console.error(e); process.exit(1); });
