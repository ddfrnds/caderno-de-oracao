import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { resolveBackground, resolveFont } from '@/lib/themes';
import { getPublishedPrayerBySlug } from '@/server/prayers';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getPublishedPrayerBySlug((await params).slug);
  return { title: p?.title ?? 'Oração' };
}

export default async function PrayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const prayer = await getPublishedPrayerBySlug((await params).slug);
  if (!prayer) notFound();
  const font = resolveFont(prayer.font);
  const theme = resolveBackground(prayer.background);
  const images = prayer.files.filter((f) => f.kind === 'image');
  const docs = prayer.files.filter((f) => f.kind === 'document');
  return (
    <>
      <SiteHeader />
      <main className="prayer-wrap">
        <Link href="/oracoes" className="back-link">← Todas as orações</Link>
        <article className="prayer-sheet" style={{ background: theme.bg, color: theme.fg, fontFamily: font.family }}>
          {prayer.cover_file_id && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="prayer-cover" src={`/api/files/${prayer.cover_file_id}`} alt={`Capa: ${prayer.title}`} />
          )}
          <h1>{prayer.title}</h1>
          {prayer.body && <div className="prayer-body" style={{ fontSize: font.size }}>{prayer.body}</div>}
          {(images.length > 0 || docs.length > 0) && (
            <div className="attachments">
              {images.map((f) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={f.id} src={`/api/files/${f.id}`} alt={f.original_name} loading="lazy" />
              ))}
              {docs.map((f) => (
                <a key={f.id} href={`/api/files/${f.id}`} download>📄 {f.original_name}</a>
              ))}
            </div>
          )}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
