'use server';

import { requireUser } from '@/server/auth';
import { validateUploads } from '@/server/files';
import { createSubmission, EmptySubmissionError } from '@/server/submissions';
import { fieldErrors, submissionSchema } from '@/lib/validation';
import type { FormState } from '@/lib/form-state';

export async function submitPrayerAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/enviar');
  const values = { title: String(fd.get('title') ?? ''), body: String(fd.get('body') ?? '') };
  const parsed = submissionSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const photos = await validateUploads(fd.getAll('photos'), { images: true, documents: false });
  if (!photos.ok) return { errors: { photos: [photos.error] }, values };
  const docs = await validateUploads(fd.getAll('documents'), { images: false, documents: true });
  if (!docs.ok) return { errors: { documents: [docs.error] }, values };
  const uploads = [...photos.files, ...docs.files];
  if (uploads.reduce((n, u) => n + u.data.length, 0) > 4 * 1024 * 1024) {
    return { message: 'Os arquivos somam mais de 4 MB. Envie menos arquivos ou reduza o tamanho.', values };
  }

  try {
    await createSubmission({ userId: user.id, title: parsed.data.title, body: parsed.data.body, uploads });
  } catch (err) {
    if (err instanceof EmptySubmissionError) {
      return { message: 'Escreva sua oração ou anexe uma foto ou arquivo antes de enviar.', values };
    }
    console.error('submit', err);
    return { message: 'Não foi possível enviar agora. Tente novamente em instantes.', values };
  }
  return { ok: true, message: 'Oração enviada. Ela será analisada antes de ser publicada.' };
}
