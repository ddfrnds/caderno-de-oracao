import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PrayerBook from '@/components/PrayerBook';
import SiteHeader from '@/components/SiteHeader';
import { parsePrayerBody, splitTitle } from '@/lib/prayer-body';
import { resolveBackground, resolveFont, skinFor } from '@/lib/themes';
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
  const { main, sub } = splitTitle(prayer.title);
  return (
    <>
      <SiteHeader />
      <main style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <PrayerBook
          slug={prayer.slug}
          title={main}
          subtitle={sub}
          coverUrl={prayer.cover_file_id ? `/api/files/${prayer.cover_file_id}` : null}
          blocks={parsePrayerBody(prayer.body)}
          attachments={prayer.files.map((f) => ({ id: f.id, name: f.original_name, kind: f.kind }))}
          fontFamily={font.family}
          fontRem={parseFloat(font.size)}
          bg={theme.bg}
          fg="#3b2a20"
          skin={skinFor(prayer.background)}
        />
      </main>
    </>
  );
}
