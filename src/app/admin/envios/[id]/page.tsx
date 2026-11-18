import Link from 'next/link';
import { notFound } from 'next/navigation';
import { approveAction, rejectAction } from '@/app/actions/admin';
import DeleteSubmission from '@/components/DeleteSubmission';
import { getSubmission } from '@/server/submissions';

const fmt = (d: Date) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(d);
const LABEL = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Recusada' } as const;
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await getSubmission((await params).id);
  if (!s) notFound();
  return (
    <div className="detail-grid">
      <Link href="/admin">← Voltar ao painel</Link>
      <div className="paper-card">
        <h1 style={{ fontSize: '2rem' }}>{s.title || 'Sem título'}</h1>
        <p className="meta">
          <span className={`badge ${s.status}`}>{LABEL[s.status]}</span>{' '}
          Enviada por <strong>{s.user_name}</strong> ({s.user_email}) em {fmt(s.created_at)}
          {s.reviewed_at && <> · analisada em {fmt(s.reviewed_at)}</>}
        </p>
        {s.body ? <div className="detail-body">{s.body}</div> : <p className="hint">Este envio não tem texto.</p>}
        {s.files.length > 0 && (
          <>
            <h2 style={{ fontSize: '1.5rem', marginTop: '1.6rem' }}>Arquivos ({s.files.length})</h2>
            <div className="file-grid">
              {s.files.map((f) => (
                <div className="file-item" key={f.id}>
                  {f.kind === 'image' ? (
                    <a href={`/api/files/${f.id}`} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/files/${f.id}`} alt={f.original_name} />
                    </a>
                  ) : (
                    <div className="doc-icon">{f.original_name.split('.').pop()?.toUpperCase()}</div>
                  )}
                  <a href={`/api/files/${f.id}`} {...(f.kind === 'image' ? { target: '_blank', rel: 'noreferrer' } : { download: true })}>{f.original_name}</a>
                  <div className="hint">{kb(f.size)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="actions-bar">
        {s.status !== 'approved' && (
          <form action={approveAction}><input type="hidden" name="id" value={s.id} /><button className="btn" type="submit">Aprovar</button></form>
        )}
        {s.status === 'approved' && s.prayer_id && <Link className="btn" href={`/admin/oracoes/${s.prayer_id}`}>Editar e publicar</Link>}
        {s.status !== 'rejected' && (
          <form action={rejectAction}><input type="hidden" name="id" value={s.id} /><button className="btn secondary" type="submit">Recusar</button></form>
        )}
        <DeleteSubmission id={s.id} />
      </div>
      {s.status === 'pending' && <p className="hint">Ao aprovar, abre o editor da oração (fonte, fundo e capa). A oração só aparece no site quando você clicar em “Publicar”.</p>}
    </div>
  );
}
