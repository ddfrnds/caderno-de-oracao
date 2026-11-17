import PrayerCoverGrid from '@/components/PrayerCover';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { listPublishedPrayers } from '@/server/prayers';

export const metadata = { title: 'Orações' };
export const dynamic = 'force-dynamic';

export default async function PrayersPage() {
  const prayers = await listPublishedPrayers();
  return (
    <>
      <SiteHeader />
      <main className="page">
        <h1 className="section-title">Orações</h1>
        <div className="ornament" aria-hidden="true">✦ ✦ ✦</div>
        {prayers.length ? <PrayerCoverGrid prayers={prayers} /> : <p className="empty">As primeiras orações serão publicadas em breve.</p>}
      </main>
      <SiteFooter />
    </>
  );
}
