import Link from 'next/link';
import PrayerEditor from '@/components/PrayerEditor';

export default function NewPrayer() {
  return (
    <>
      <p><Link href="/admin?status=oracoes">← Orações</Link></p>
      <h1 style={{ fontSize: '2rem' }}>Nova oração</h1>
      <PrayerEditor prayer={{ title: '', body: '', font: 'cormorant', background: 'pergaminho', cover_file_id: null, published: false, files: [], included: [] }} />
    </>
  );
}
