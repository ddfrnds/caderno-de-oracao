import Image from 'next/image';
import Link from 'next/link';
import Paperclip from '@/components/Paperclip';
import PrayerCoverGrid from '@/components/PrayerCover';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { listPublishedPrayers } from '@/server/prayers';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const prayers = await listPublishedPrayers();
  return (
    <>
      <SiteHeader overlay />
      <main>
        <section className="hero" aria-label="Caderno de oração">
          <div className="stage">
            <div className="cream" aria-hidden="true" />
            <Image className="lace" src="/img/renda.png" alt="" width={840} height={1230} priority />
            <div className="title">
              <h1>
                <span>Caderno</span>
                <span>de oração</span>
              </h1>
              <div className="rule" aria-hidden="true" />
              <p>orações de fé e devoção</p>
            </div>

            <div className="stamp">
              <Link href="/oracoes" className="stamp-img" aria-label="Orações">
                <Image src="/img/selo-cordeiro.png" alt="Cordeiro junto à cruz, gravura antiga" width={742} height={1018} priority />
                <Paperclip className="clip" />
              </Link>
              <Link href="/oracoes" className="tag">Orações</Link>
            </div>

            <div className="feather">
              <Link href="/enviar" className="feather-img" aria-label="Enviar oração">
                <Image src="/img/pena.png" alt="Pena de escrever" width={654} height={1078} priority />
              </Link>
              <Link href="/enviar" className="tag">Enviar oração</Link>
            </div>
          </div>
        </section>

        <section className="library" id="oracoes" aria-labelledby="oracoes-titulo">
          <div className="page">
            <h2 className="section-title" id="oracoes-titulo">Orações</h2>
            <div className="ornament" aria-hidden="true">✦ ✦ ✦</div>
            {prayers.length ? (
              <PrayerCoverGrid prayers={prayers} />
            ) : (
              <p className="empty">As primeiras orações serão publicadas em breve.</p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter dark />
    </>
  );
}
