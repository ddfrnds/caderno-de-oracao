import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { isBackground, resolveBackground, skinFor, SKINS, SKIN_PREFIX } from '../src/lib/themes';
import { prayerSchema } from '../src/lib/validation';
import { deleteFile, getFileForViewer, validateUploads } from '../src/server/files';
import { optimizeImage } from '../src/server/image-optimize';
import { createPrayer, getPrayerForEditor } from '../src/server/prayers';
import { query } from '../src/server/db';
import { sniffFile } from '../src/lib/file-sniff';
import { file, makeUser } from './helpers';

async function bigPhoto(w = 3200, h = 2400) {
  const raw = Buffer.alloc(w * h * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = (i * 7919 + (i >> 9)) & 255; // ruído: arquivo pesado
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 95 }).toBuffer();
}

describe('minificação de imagens', () => {
  it('reduz foto grande para no máximo 1600 px em WebP e diminui o arquivo', async () => {
    const jpg = await bigPhoto();
    const opt = await optimizeImage(jpg, sniffFile(jpg)!);
    expect(opt.changed).toBe(true);
    expect(opt.sniffed.ext).toBe('webp');
    const meta = await sharp(opt.data).metadata();
    expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(1600);
    expect(opt.data.length).toBeLessThan(jpg.length);
  });
  it('não mexe em imagem pequena nem em GIF', async () => {
    const small = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#fff' } }).png().toBuffer();
    expect((await optimizeImage(small, sniffFile(small)!)).changed).toBe(false);
    const gif = Buffer.from('GIF89a\u0001\u0000\u0001\u0000', 'latin1');
    expect((await optimizeImage(gif, { mime: 'image/gif', ext: 'gif', kind: 'image' })).changed).toBe(false);
  });
  it('validateUploads devolve a imagem já otimizada e com extensão .webp', async () => {
    const jpg = await bigPhoto(2400, 1800);
    const r = await validateUploads([file(jpg, 'foto celular.jpg')]);
    expect(r.ok && r.files[0].sniffed.ext).toBe('webp');
    expect(r.ok && r.files[0].name).toBe('foto celular.webp');
  });
});

describe('fundos e molduras', () => {
  it('aceita cores, personalizada e molduras; rejeita ids inexistentes', () => {
    expect(isBackground('borgonha')).toBe(true);
    expect(isBackground('#12aB34')).toBe(true);
    expect(isBackground(SKIN_PREFIX + SKINS[0].id)).toBe(true);
    expect(isBackground('skin:nao-existe')).toBe(false);
    expect(prayerSchema.safeParse({ title: 'a', body: '', font: 'garamond', background: 'skin:grande-verde' }).success).toBe(true);
  });
  it('há ao menos um "papel grande" e toda moldura tem área útil válida', () => {
    expect(SKINS.some((s) => s.kind === 'large')).toBe(true);
    for (const s of SKINS.filter((x) => x.kind === 'frame')) {
      expect(s.paper.left + s.paper.right).toBeLessThan(60);
      expect(s.paper.top + s.paper.bottom).toBeLessThan(75);
    }
    expect(resolveBackground('skin:grande-vinho').bg).toBe(skinFor('skin:grande-vinho')!.backdrop);
  });
});

describe('excluir arquivo enviado', () => {
  it('apaga o registro, solta a capa e o arquivo deixa de ser acessível', async () => {
    const admin = await makeUser({ role: 'admin' });
    const png = await sharp({ create: { width: 60, height: 60, channels: 3, background: '#a33' } }).png().toBuffer();
    const v = await validateUploads([file(png, 'capa.png')]);
    if (!v.ok) throw new Error(v.error);
    const id = await createPrayer({ title: 'Com capa', body: 'x', font: 'garamond', background: 'borgonha', coverUpload: v.files[0], publish: true });
    const before = await getPrayerForEditor(id);
    const coverId = before!.cover_file_id!;
    expect(coverId).toBeTruthy();
    expect(await deleteFile(coverId)).toBe(true);
    expect((await getPrayerForEditor(id))!.cover_file_id).toBeNull();
    expect(await getFileForViewer(coverId, admin)).toBeNull();
    expect((await query('select 1 from files where id = $1', [coverId])).rowCount).toBe(0);
    expect(await deleteFile(coverId)).toBe(false);
    expect(await deleteFile('nao-e-uuid')).toBe(false);
  });
});
