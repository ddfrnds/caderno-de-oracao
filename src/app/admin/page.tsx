import Link from 'next/link';
import { togglePublishAction } from '@/app/actions/admin';
import { listAllPrayers } from '@/server/prayers';
import { countByStatus, listSubmissions, type SubmissionStatus } from '@/server/submissions';

const fmt = (d: Date) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(d);
const LABEL: Record<SubmissionStatus, string> = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Recusada' };

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const raw = (await searchParams).status;
  const tab = raw === 'approved' || raw === 'rejected' || raw === 'oracoes' || raw === 'todas' ? raw : 'pending';
  const counts = await countByStatus();
  const tabs: [string, string, number | undefined][] = [
    ['pending', 'Pendentes', counts.pending],
    ['approved', 'Aprovadas', counts.approved],
    ['rejected', 'Recusadas', counts.rejected],
    ['todas', 'Todos os envios', undefined],
    ['oracoes', 'Orações publicadas', undefined],
  ];
  const subs = tab === 'oracoes' ? [] : await listSubmissions(tab === 'todas' ? undefined : (tab as SubmissionStatus));
  const prayers = tab === 'oracoes' ? await listAllPrayers() : [];
  return (
    <>
      <h1 className="section-title" style={{ fontSize: '3rem' }}>Painel</h1>
      <div className="actions-bar" style={{ justifyContent: 'center' }}>
        <Link className="btn small" href="/admin/oracoes/nova">Nova oração</Link>
      </div>
      <nav className="admin-tabs" aria-label="Seções do painel">
        {tabs.map(([key, label, n]) => (
          <Link key={key} href={`/admin?status=${key}`} aria-current={tab === key ? 'page' : undefined}>
            {label}{n !== undefined && <span className="count">{n}</span>}
          </Link>
        ))}
      </nav>

      {tab !== 'oracoes' && (subs.length === 0 ? <p className="empty">Nenhum envio nesta lista.</p> : subs.map((s) => (
        <div className="row-card" key={s.id}>
          <div>
            <h3><Link href={`/admin/envios/${s.id}`}>{s.title || 'Sem título'}</Link></h3>
            <div className="meta">
              <span className={`badge ${s.status}`}>{LABEL[s.status]}</span>{' '}
              {s.user_name} · {s.user_email} · {fmt(s.created_at)}
              {s.file_count > 0 && <> · {s.file_count} arquivo(s)</>}
            </div>
            {s.excerpt && <p className="excerpt">{s.excerpt}{s.excerpt.length >= 160 ? '…' : ''}</p>}
          </div>
          <Link className="btn small secondary" href={`/admin/envios/${s.id}`}>Abrir</Link>
        </div>
      )))}

      {tab === 'oracoes' && (prayers.length === 0 ? <p className="empty">Nenhuma oração criada ainda.</p> : prayers.map((p) => (
        <div className="row-card" key={p.id}>
          <div>
            <h3><Link href={`/admin/oracoes/${p.id}`}>{p.title}</Link></h3>
            <div className="meta">
              <span className={`badge ${p.published ? 'published' : 'pending'}`}>{p.published ? 'Publicada' : 'Rascunho'}</span>{' '}
              {p.published_at ? `desde ${fmt(p.published_at)}` : `criada em ${fmt(p.created_at)}`}
            </div>
          </div>
          <div className="actions-bar">
            <form action={togglePublishAction}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="publish" value={p.published ? '0' : '1'} />
              <button className="btn small secondary" type="submit">{p.published ? 'Despublicar' : 'Publicar'}</button>
            </form>
            <Link className="btn small" href={`/admin/oracoes/${p.id}`}>Editar</Link>
          </div>
        </div>
      )))}
    </>
  );
}
