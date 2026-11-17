'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { forgotAction, loginAction, resetAction, signupAction } from '@/app/actions/auth';
import { Field } from './Field';
import { SubmitButton } from './SubmitButton';

const qs = (next: string) => (next && next !== '/' ? `?next=${encodeURIComponent(next)}` : '');

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} noValidate>
      {notice && <div className="alert ok" role="status">{notice}</div>}
      {state?.message && <div className="alert error" role="alert">{state.message}</div>}
      <input type="hidden" name="next" value={next} />
      <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} errors={state?.errors} />
      <Field label="Senha" name="password" type="password" autoComplete="current-password" errors={state?.errors} />
      <div className="form-actions"><SubmitButton pendingText="Entrando…">Entrar</SubmitButton></div>
      <div className="form-links">
        <Link href="/recuperar-senha">Esqueci minha senha</Link>
        <span>Ainda não tem conta? <Link href={`/cadastro${qs(next)}`}>Criar conta</Link></span>
      </div>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const [state, action] = useActionState(signupAction, undefined);
  return (
    <form action={action} noValidate>
      {state?.message && <div className="alert error" role="alert">{state.message}</div>}
      <input type="hidden" name="next" value={next} />
      <Field label="Nome completo" name="name" autoComplete="name" defaultValue={state?.values?.name} errors={state?.errors} />
      <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} errors={state?.errors} />
      <Field label="Senha" name="password" type="password" autoComplete="new-password" hint="Mínimo de 8 caracteres." errors={state?.errors} />
      <Field label="Confirmar senha" name="confirm" type="password" autoComplete="new-password" errors={state?.errors} />
      <div className="form-actions"><SubmitButton pendingText="Criando conta…">Criar conta</SubmitButton></div>
      <div className="form-links">
        <span>Já tem cadastro? <Link href={`/login${qs(next)}`}>Entrar</Link></span>
      </div>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(forgotAction, undefined);
  return (
    <form action={action} noValidate>
      {state?.ok && <div className="alert ok" role="status">{state.message}</div>}
      <Field label="E-mail da sua conta" name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} errors={state?.errors} />
      <div className="form-actions"><SubmitButton pendingText="Enviando…">Enviar link</SubmitButton></div>
      <div className="form-links"><Link href="/login">Voltar ao login</Link></div>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetAction, undefined);
  return (
    <form action={action} noValidate>
      {state?.message && <div className="alert error" role="alert">{state.message} <Link href="/recuperar-senha">Pedir novo link</Link></div>}
      <input type="hidden" name="token" value={token} />
      <Field label="Nova senha" name="password" type="password" autoComplete="new-password" hint="Mínimo de 8 caracteres." errors={state?.errors} />
      <Field label="Confirmar nova senha" name="confirm" type="password" autoComplete="new-password" errors={state?.errors} />
      <div className="form-actions"><SubmitButton pendingText="Salvando…">Salvar nova senha</SubmitButton></div>
    </form>
  );
}
