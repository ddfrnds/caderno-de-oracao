import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deletePrayerAction } from '@/app/actions/admin';
import PrayerEditor from '@/components/PrayerEditor';
import { getPrayerForEditor } from '@/server/prayers';

export default async function EditPrayer({ params }: { params: Promise<{ id: string }> }) {
  const p = await getPrayerForEditor((await params).id);
  if (!p) notFound();
  return (
    <>
      <p>
        <Link href="/admin?status=oracoes">← Orações</Link>
        {p.submission_id && <> · <Link href={`/admin/envios/${p.submission_id}`}>Ver envio original</Link></>}
        {p.published && <> · <Link href={`/oracoes/${p.slug}`}>Ver no site</Link></>}
      </p>
      <h1 style={{ fontSize: '2rem' }}>Editar oração</h1>
      <PrayerEditor
        key={p.id}
        prayer={{
          id: p.id, title: p.title, body: p.body, font: p.font, background: p.background, cover_file_id: p.cover_file_id,
          published: p.published, included: [...p.included],
          files: p.files.map((f) => ({ id: f.id, original_name: f.original_name, kind: f.kind })),
        }}
      />
      <form action={deletePrayerAction} style={{ marginTop: '2.5rem' }}>
        <input type="hidden" name="id" value={p.id} />
        <button className="btn danger small" type="submit">Excluir oração</button>
      </form>
    </>
  );
}
