'use client';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Block } from '@/lib/prayer-body';
import PrayerBody from './PrayerBody';

type Attachment = { id: string; name: string; kind: 'image' | 'document' };
type Props = {
  slug: string;
  title: string;
  subtitle?: string;
  coverUrl: string | null;
  blocks: Block[];
  attachments: Attachment[];
  fontFamily: string;
  fontRem: number;
  bg: string;
  fg: string;
};

const SCALES = [0.85, 1, 1.15, 1.3, 1.5];
const GAP = 48;

export default function PrayerBook({ slug, title, subtitle, coverUrl, blocks, attachments, fontFamily, fontRem, bg, fg }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);
  const [scaleIdx, setScaleIdx] = useState(1);
  const restored = useRef(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  // tamanho da letra e página lidos do navegador (por oração)
  useEffect(() => {
    try {
      const s = Number(localStorage.getItem('reader:scale'));
      if (Number.isInteger(s) && s >= 0 && s < SCALES.length) setScaleIdx(s);
    } catch { /* sem localStorage */ }
  }, []);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setSize({ w: Math.floor(el.clientWidth), h: Math.floor(el.clientHeight) });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const recount = useCallback(() => {
    const flow = flowRef.current;
    if (!flow || !size.w) return;
    const n = Math.max(1, Math.round((flow.scrollWidth + GAP) / (size.w + GAP)));
    setPages(n);
    setPage((p) => Math.min(p, n - 1));
  }, [size.w]);

  useLayoutEffect(() => {
    recount();
    const flow = flowRef.current;
    if (!flow) return;
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    fonts?.ready.then(recount);
    const imgs = Array.from(flow.querySelectorAll('img'));
    imgs.forEach((i) => i.addEventListener('load', recount));
    return () => imgs.forEach((i) => i.removeEventListener('load', recount));
  }, [recount, size.h, scaleIdx, blocks]);

  // volta para a última página lida
  useEffect(() => {
    if (restored.current || pages <= 1) return;
    restored.current = true;
    try {
      const p = Number(localStorage.getItem(`reader:${slug}`));
      if (Number.isInteger(p) && p > 0 && p < pages) setPage(p);
    } catch { /* ignore */ }
  }, [pages, slug]);

  useEffect(() => {
    if (!restored.current) return;
    try { localStorage.setItem(`reader:${slug}`, String(page)); } catch { /* ignore */ }
  }, [page, slug]);

  const go = useCallback((d: number) => setPage((p) => Math.max(0, Math.min(pages - 1, p + d))), [pages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const changeScale = (d: number) => {
    const next = Math.max(0, Math.min(SCALES.length - 1, scaleIdx + d));
    setScaleIdx(next);
    try { localStorage.setItem('reader:scale', String(next)); } catch { /* ignore */ }
  };

  const style = {
    '--pw': `${size.w}px`,
    '--ph': `${size.h}px`,
    '--gap': `${GAP}px`,
    '--fs': `${fontRem * SCALES[scaleIdx]}rem`,
    fontFamily,
    color: fg,
  } as React.CSSProperties;

  return (
    <div className="reader" style={{ background: bg }}>
      <Link href="/oracoes" className="reader-back" style={{ color: bg === '#ffffff' ? '#000' : undefined }}>← Orações</Link>

      <div className="book" role="group" aria-label={`Livro: ${title}`}>
        <div className="book-paper">
          <div
            ref={viewportRef}
            className="book-viewport"
            onPointerDown={(e) => { touch.current = { x: e.clientX, y: e.clientY }; }}
            onPointerUp={(e) => {
              const t = touch.current; touch.current = null;
              if (!t) return;
              const dx = e.clientX - t.x, dy = e.clientY - t.y;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
            }}
          >
            <div
              ref={flowRef}
              className="book-flow"
              style={{ ...style, width: size.w, height: size.h, columnWidth: size.w || undefined, columnGap: GAP, transform: `translateX(${-page * (size.w + GAP)}px)` }}
            >
              <section className="pb-cover">
                {coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt={`Capa: ${title}`} />
                )}
                <h1>{title}</h1>
                {subtitle && <p className="pb-sub">{subtitle}</p>}
                <p className="pb-hint">Vire a página →</p>
              </section>
              <PrayerBody blocks={blocks} />
              {attachments.length > 0 && (
                <section className="pb-attach">
                  <h2 className="pb-heading">Anexos</h2>
                  {attachments.map((a) =>
                    a.kind === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={a.id} src={`/api/files/${a.id}`} alt={a.name} />
                    ) : (
                      <p key={a.id} className="pb-center"><a href={`/api/files/${a.id}`} download>📄 {a.name}</a></p>
                    ),
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="reader-controls" style={{ color: '#f6ead6' }}>
        <button type="button" onClick={() => go(-1)} disabled={page === 0} aria-label="Página anterior">‹</button>
        <span role="status" aria-live="polite">{page + 1} / {pages}</span>
        <button type="button" onClick={() => go(1)} disabled={page >= pages - 1} aria-label="Próxima página">›</button>
        <span className="sep" aria-hidden="true" />
        <button type="button" onClick={() => changeScale(-1)} disabled={scaleIdx === 0} aria-label="Diminuir letra">A−</button>
        <button type="button" onClick={() => changeScale(1)} disabled={scaleIdx === SCALES.length - 1} aria-label="Aumentar letra">A+</button>
      </div>
    </div>
  );
}
