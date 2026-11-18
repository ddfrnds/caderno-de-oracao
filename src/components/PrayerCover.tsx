import Link from 'next/link';
import type { PrayerCard } from '@/server/prayers';

export default function PrayerCoverGrid({ prayers }: { prayers: PrayerCard[] }) {
  return (
    <div className="grid-covers">
      {prayers.map((p) => (
        <Link key={p.id} href={`/oracoes/${p.slug}`} className="cover-card">
          <span className="cover">
            {p.cover_file_id ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/files/${p.cover_file_id}`} alt={`Capa: ${p.title}`} loading="lazy" />
            ) : (
              <span className="cover-fallback">{p.title}</span>
            )}
          </span>
          <span className="cap">{p.title}</span>
        </Link>
      ))}
    </div>
  );
}
