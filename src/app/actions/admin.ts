'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/server/auth';
import { validateUploads } from '@/server/files';
import { createPrayer, deletePrayer, setPublished, updatePrayer, type PrayerInput } from '@/server/prayers';
import { approveSubmission, deleteSubmission, PrayerExistsError, rejectSubmission } from '@/server/submissions';
import { fieldErrors, prayerSchema } from '@/lib/validation';
import type { FormState } from '@/lib/form-state';

const UUID = /^[0-9a-f-]{36}$/;
const id = (fd: FormData, k = 'id') => {
  const v = String(fd.get(k) ?? '');
  if (!UUID.test(v)) throw new Error('ID inválido');
  return v;
};

export async function approveAction(fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  const prayerId = await approveSubmission(id(fd), admin.id);
  revalidatePath('/admin');
  redirect(`/admin/oracoes/${prayerId}`); // aprovar leva ao editor: fonte, fundo e publicação
}

export async function rejectAction(fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  await rejectSubmission(id(fd), admin.id);
  revalidatePath('/', 'layout');
  redirect('/admin?status=rejected');
}

export async function deleteSubmissionAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    await deleteSubmission(id(fd));
  } catch (err) {
    if (err instanceof PrayerExistsError) return { message: 'Este envio já virou uma oração. Exclua a oração primeiro.' };
    throw err;
  }
  revalidatePath('/admin');
  redirect('/admin');
}

function readPrayerForm(fd: FormData) {
  return {
    title: String(fd.get('title') ?? ''),
    body: String(fd.get('body') ?? ''),
    font: String(fd.get('font') ?? 'cormorant'),
    background: fd.get('background') === 'custom' ? String(fd.get('customColor') ?? '') : String(fd.get('background') ?? 'pergaminho'),
  };
}

async function buildInput(fd: FormData): Promise<{ input?: PrayerInput; state?: FormState }> {
  const values = readPrayerForm(fd);
  const parsed = prayerSchema.safeParse(values);
  if (!parsed.success) return { state: { errors: fieldErrors(parsed.error), values } };
  const coverUp = await validateUploads(fd.getAll('coverUpload'), { images: true, documents: false });
  if (!coverUp.ok) return { state: { errors: { coverUpload: [coverUp.error] }, values } };
  const extra = await validateUploads(fd.getAll('extraFiles'));
  if (!extra.ok) return { state: { errors: { extraFiles: [extra.error] }, values } };
  const size = [...coverUp.files, ...extra.files].reduce((n, f) => n + f.data.length, 0);
  if (size > 4 * 1024 * 1024) return { state: { message: 'Os arquivos somam mais de 4 MB.', values } };
  const cover = String(fd.get('coverFileId') ?? '');
  return {
    input: {
      ...parsed.data,
      coverFileId: UUID.test(cover) ? cover : null,
      includeFileIds: fd.getAll('include').map(String).filter((v) => UUID.test(v)),
      coverUpload: coverUp.files[0] ?? null,
      uploads: extra.files,
    },
  };
}

export async function savePrayerAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const prayerId = id(fd);
  const { input, state } = await buildInput(fd);
  if (!input) return state;
  const intent = String(fd.get('intent') ?? 'save');
  input.publish = intent === 'publish' ? true : intent === 'unpublish' ? false : undefined;
  await updatePrayer(prayerId, input);
  revalidatePath('/', 'layout');
  return { ok: true, message: intent === 'publish' ? 'Oração publicada.' : intent === 'unpublish' ? 'Oração despublicada.' : 'Alterações salvas.' };
}

export async function createPrayerAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const { input, state } = await buildInput(fd);
  if (!input) return state;
  input.publish = String(fd.get('intent')) === 'publish';
  const newId = await createPrayer(input);
  revalidatePath('/', 'layout');
  redirect(`/admin/oracoes/${newId}`);
}

export async function deletePrayerAction(fd: FormData): Promise<void> {
  await requireAdmin();
  await deletePrayer(id(fd));
  revalidatePath('/', 'layout');
  redirect('/admin?status=oracoes');
}

export async function togglePublishAction(fd: FormData): Promise<void> {
  await requireAdmin();
  await setPublished(id(fd), String(fd.get('publish')) === '1');
  revalidatePath('/', 'layout');
  redirect('/admin?status=oracoes');
}
