'use client';
import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { submitPrayerAction } from '@/app/actions/submit';
import FilePicker from './FilePicker';
import { SubmitButton } from './SubmitButton';

export const REVIEW_NOTICE =
  'Todas as orações enviadas passarão por uma análise antes de serem publicadas no site. Após a aprovação, o conteúdo ficará disponível para todos os visitantes.';

export default function SubmitPrayerForm() {
  const [state, action] = useActionState(submitPrayerAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  if (state?.ok) {
    return (
      <div role="status">
        <div className="alert ok">{state.message}</div>
        <p className="subtitle">Obrigado por compartilhar sua oração.</p>
        <div className="form-actions">
          <Link className="btn secondary" href="/oracoes">Ver orações</Link>
          {/* link comum: recarrega a página e limpa o formulário */}
          <a className="btn" href="/enviar">Enviar outra</a>
        </div>
      </div>
    );
  }

  const e = state?.errors;
  return (
    <form ref={formRef} action={action} noValidate onSubmit={(ev) => {
      // o envio só acontece depois de o aviso ser confirmado no diálogo
      if (!dialogRef.current?.dataset.confirmed) { ev.preventDefault(); dialogRef.current?.showModal(); }
      else delete dialogRef.current.dataset.confirmed;
    }}>
      {state?.message && <div className="alert error" role="alert">{state.message}</div>}
      <div className="alert notice">{REVIEW_NOTICE}</div>

      <div className="field">
        <label htmlFor="title">Título (opcional)</label>
        <input id="title" name="title" type="text" maxLength={150} defaultValue={state?.values?.title} />
        {e?.title && <span className="error" role="alert">{e.title[0]}</span>}
      </div>
      <div className="field">
        <label htmlFor="body">Texto da oração</label>
        <textarea id="body" name="body" maxLength={20000} defaultValue={state?.values?.body} placeholder="Escreva ou cole sua oração aqui…" />
        {e?.body && <span className="error" role="alert">{e.body[0]}</span>}
      </div>
      <div className="field">
        <label htmlFor="photos">Fotos (opcional)</label>
        <FilePicker id="photos" name="photos" accept="image/jpeg,image/png,image/webp,image/gif" multiple images />
        <span className="hint">As fotos são reduzidas automaticamente. Você pode remover qualquer uma antes de enviar.</span>
        {e?.photos && <span className="error" role="alert">{e.photos[0]}</span>}
      </div>
      <div className="field">
        <label htmlFor="documents">Arquivos (opcional)</label>
        <FilePicker id="documents" name="documents" accept=".pdf,.doc,.docx,.odt,.rtf,.txt" multiple />
        <span className="hint">PDF, DOC, DOCX, ODT, RTF ou TXT. Os arquivos somam, no máximo, 4 MB.</span>
        {e?.documents && <span className="error" role="alert">{e.documents[0]}</span>}
      </div>

      <div className="form-actions"><SubmitButton pendingText="Enviando…">Enviar oração</SubmitButton></div>

      <dialog ref={dialogRef} className="notice-dialog" aria-labelledby="aviso-titulo">
        <h2 id="aviso-titulo">Antes de enviar</h2>
        <p>{REVIEW_NOTICE}</p>
        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={() => dialogRef.current?.close()}>Voltar</button>
          <button type="button" className="btn" onClick={() => {
            if (dialogRef.current) dialogRef.current.dataset.confirmed = '1';
            dialogRef.current?.close();
            formRef.current?.requestSubmit();
          }}>Entendi, enviar</button>
        </div>
      </dialog>
    </form>
  );
}
