'use client';
import { useActionState } from 'react';
import { deleteSubmissionAction } from '@/app/actions/admin';

export default function DeleteSubmission({ id }: { id: string }) {
  const [state, action] = useActionState(deleteSubmissionAction, undefined);
  return (
    <form action={action} onSubmit={(e) => { if (!confirm('Excluir este envio e seus arquivos? Esta ação não pode ser desfeita.')) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <button className="btn danger" type="submit">Excluir</button>
      {state?.message && <span className="error" role="alert"> {state.message}</span>}
    </form>
  );
}
