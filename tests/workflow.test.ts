import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { query } from '../src/server/db';
import { getFileForViewer, MAX_TOTAL_BYTES, validateUploads } from '../src/server/files';
import {
  createPrayer,
  deletePrayer,
  getPrayerForEditor,
  getPublishedPrayerBySlug,
  listPublishedPrayers,
  setPublished,
  updatePrayer,
} from '../src/server/prayers';
import {
  approveSubmission,
  createSubmission,
  deleteSubmission,
  EmptySubmissionError,
  getSubmission,
  listSubmissions,
  PrayerExistsError,
  rejectSubmission,
} from '../src/server/submissions';
import { file, makeUser, PDF, PNG } from './helpers';

async function send(userId: string, opts: { title?: string; body?: string; files?: File[] } = {}) {
  const v = await validateUploads(opts.files ?? []);
  if (!v.ok) throw new Error(v.error);
  return createSubmission({ userId, title: opts.title, body: opts.body, uploads: v.files });
}

describe('validação de uploads', () => {
  it('ignora campos vazios, aceita tipos válidos e rejeita falsificados', async () => {
    expect((await validateUploads([new File([], '')])).ok).toBe(true);
    const ok = await validateUploads([file(PNG, 'foto.png'), file(PDF, 'oracao.pdf')]);
    expect(ok.ok && ok.files.map((f) => f.sniffed.ext)).toEqual(['png', 'pdf']);
    const fake = await validateUploads([file(Buffer.from([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0]), 'virus.png')]);
    expect(fake.ok).toBe(false);
  });
  it('limita quantidade e tamanho', async () => {
    const many = await validateUploads(Array.from({ length: 7 }, (_, i) => file(PNG, `${i}.png`)));
    expect(many.ok).toBe(false);
    const big = await validateUploads([file(Buffer.concat([PDF, Buffer.alloc(MAX_TOTAL_BYTES)]), 'grande.pdf')]);
    expect(big.ok).toBe(false);
  });
  it('respeita o tipo permitido no campo', async () => {
    expect((await validateUploads([file(PDF, 'a.pdf')], { images: true, documents: false })).ok).toBe(false);
  });
});

describe('fluxo de envio, análise e publicação', () => {
  it('não aceita envio vazio', async () => {
    const u = await makeUser();
    await expect(send(u.id, {})).rejects.toBeInstanceOf(EmptySubmissionError);
  });

  it('envio fica pendente, aprovação cria rascunho e só a publicação o torna público', async () => {
    const user = await makeUser({ name: 'Joana Lima' });
    const admin = await makeUser({ role: 'admin' });
    const id = await send(user.id, { title: 'Oração da manhã', body: 'Senhor, guia meu dia.', files: [file(PNG, 'capa.png'), file(PDF, 'anexo.pdf')] });

    let s = await getSubmission(id);
    expect(s?.status).toBe('pending');
    expect(s?.user_name).toBe('Joana Lima');
    expect(s?.files).toHaveLength(2);
    expect(await listPublishedPrayers()).toHaveLength(0);

    const prayerId = await approveSubmission(id, admin.id);
    s = await getSubmission(id);
    expect(s?.status).toBe('approved');
    expect(await listPublishedPrayers()).toHaveLength(0); // aprovar não publica

    const draft = await getPrayerForEditor(prayerId);
    expect(draft?.title).toBe('Oração da manhã');
    expect(draft?.cover_file_id).toBe(s?.files.find((f) => f.kind === 'image')?.id);

    await updatePrayer(prayerId, {
      title: 'Oração da manhã', body: 'Senhor, guia meu dia.', font: 'cinzel', background: 'marfim',
      coverFileId: draft!.cover_file_id, includeFileIds: s!.files.filter((f) => f.kind === 'document').map((f) => f.id), publish: true,
    });
    const pub = await getPublishedPrayerBySlug('oracao-da-manha');
    expect(pub?.font).toBe('cinzel');
    expect(pub?.files.map((f) => f.original_name)).toEqual(['anexo.pdf']);
    expect(await listPublishedPrayers()).toHaveLength(1);
  });

  it('aprovar duas vezes não duplica a oração e slugs repetidos recebem sufixo', async () => {
    const user = await makeUser();
    const admin = await makeUser({ role: 'admin' });
    const a = await send(user.id, { title: 'Ave Maria', body: 'a' });
    const b = await send(user.id, { title: 'Ave Maria', body: 'b' });
    const p1 = await approveSubmission(a, admin.id);
    expect(await approveSubmission(a, admin.id)).toBe(p1);
    const p2 = await approveSubmission(b, admin.id);
    const { rows } = await query<{ slug: string }>('select slug from prayers order by created_at');
    expect(rows.map((r) => r.slug)).toEqual(['ave-maria', 'ave-maria-2']);
    expect(p1).not.toBe(p2);
  });

  it('recusar despublica e orações recusadas não aparecem publicamente', async () => {
    const user = await makeUser();
    const admin = await makeUser({ role: 'admin' });
    const id = await send(user.id, { title: 'Teste', body: 'texto' });
    const prayerId = await approveSubmission(id, admin.id);
    await setPublished(prayerId, true);
    expect(await listPublishedPrayers()).toHaveLength(1);
    await rejectSubmission(id, admin.id);
    expect(await listPublishedPrayers()).toHaveLength(0);
    expect((await listSubmissions('rejected')).map((s) => s.id)).toEqual([id]);
  });

  it('exclui envio inadequado e remove os arquivos do storage; bloqueia se já virou oração', async () => {
    const user = await makeUser();
    const admin = await makeUser({ role: 'admin' });
    const id = await send(user.id, { body: 'x', files: [file(PNG, 'a.png')] });
    const key = (await getSubmission(id))!.files[0].storage_key;
    expect(existsSync(path.resolve('.data/test-uploads', key))).toBe(true);
    await deleteSubmission(id);
    expect(await getSubmission(id)).toBeNull();
    expect(existsSync(path.resolve('.data/test-uploads', key))).toBe(false);

    const id2 = await send(user.id, { title: 'Y', body: 'y' });
    await approveSubmission(id2, admin.id);
    await expect(deleteSubmission(id2)).rejects.toBeInstanceOf(PrayerExistsError);
  });

  it('administrador cria oração direta com capa e apaga junto os arquivos próprios', async () => {
    const v = await validateUploads([file(PNG, 'capa.png')]);
    if (!v.ok) throw new Error(v.error);
    const id = await createPrayer({ title: 'Primeira oração', body: 'Texto', font: 'cormorant', background: 'pergaminho', coverUpload: v.files[0], publish: true });
    const p = await getPublishedPrayerBySlug('primeira-oracao');
    expect(p?.cover_file_id).toBeTruthy();
    const { rows } = await query<{ storage_key: string }>('select storage_key from files');
    await deletePrayer(id);
    expect(existsSync(path.resolve('.data/test-uploads', rows[0].storage_key))).toBe(false);
    expect(await listPublishedPrayers()).toHaveLength(0);
  });
});

describe('controle de acesso aos arquivos', () => {
  it('privado: só dono e admin; público apenas quando a oração está publicada', async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const admin = await makeUser({ role: 'admin' });
    const id = await send(owner.id, { title: 'Z', body: 'z', files: [file(PNG, 'a.png')] });
    const fileId = (await getSubmission(id))!.files[0].id;

    expect(await getFileForViewer(fileId, null)).toBeNull();
    expect(await getFileForViewer(fileId, other)).toBeNull();
    expect(await getFileForViewer(fileId, owner)).not.toBeNull();
    expect(await getFileForViewer(fileId, admin)).not.toBeNull();

    const prayerId = await approveSubmission(id, admin.id); // capa = a.png, ainda rascunho
    expect(await getFileForViewer(fileId, null)).toBeNull();
    await setPublished(prayerId, true);
    expect(await getFileForViewer(fileId, null)).not.toBeNull();
    await setPublished(prayerId, false);
    expect(await getFileForViewer(fileId, null)).toBeNull();
    expect(await getFileForViewer('../../etc/passwd', admin)).toBeNull();
  });
});
