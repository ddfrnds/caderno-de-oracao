'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { endSession, startSession } from '@/server/auth';
import { requestPasswordReset, resetPassword } from '@/server/password-reset';
import { createUser, EmailTakenError, TooManyAttemptsError, verifyCredentials } from '@/server/users';
import { safeNext } from '@/lib/safe-next';
import { fieldErrors, forgotSchema, loginSchema, resetSchema, signupSchema } from '@/lib/validation';
import type { FormState } from '@/lib/form-state';

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '');

export async function signupAction(_: FormState, fd: FormData): Promise<FormState> {
  const next = safeNext(str(fd, 'next'));
  const values = { name: str(fd, 'name'), email: str(fd, 'email') };
  const parsed = signupSchema.safeParse({ ...values, password: str(fd, 'password'), confirm: str(fd, 'confirm') });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  try {
    const user = await createUser(parsed.data);
    await startSession(user.id);
  } catch (err) {
    if (err instanceof EmailTakenError) return { errors: { email: ['Este e-mail já está cadastrado. Faça login.'] }, values };
    console.error('signup', err);
    return { message: 'Não foi possível criar a conta agora. Tente novamente em instantes.', values };
  }
  redirect(next);
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const next = safeNext(str(fd, 'next'));
  const values = { email: str(fd, 'email') };
  const parsed = loginSchema.safeParse({ email: values.email, password: str(fd, 'password') });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  try {
    const user = await verifyCredentials(parsed.data.email, parsed.data.password);
    if (!user) return { message: 'E-mail ou senha incorretos.', values };
    await startSession(user.id);
  } catch (err) {
    if (err instanceof TooManyAttemptsError) {
      return { message: 'Muitas tentativas. Aguarde alguns minutos ou recupere sua senha.', values };
    }
    console.error('login', err);
    return { message: 'Não foi possível entrar agora. Tente novamente em instantes.', values };
  }
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect('/');
}

async function baseUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const h = await headers();
  return `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host') ?? 'localhost:3000'}`;
}

export async function forgotAction(_: FormState, fd: FormData): Promise<FormState> {
  const values = { email: str(fd, 'email') };
  const parsed = forgotSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  try {
    await requestPasswordReset(parsed.data.email, await baseUrl());
  } catch (err) {
    console.error('forgot', err);
  }
  // mesma resposta exista ou não a conta, para não revelar e-mails cadastrados
  return { ok: true, message: 'Se o e-mail estiver cadastrado, enviamos um link para criar uma nova senha. Verifique também a caixa de spam.' };
}

export async function resetAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse({ token: str(fd, 'token'), password: str(fd, 'password'), confirm: str(fd, 'confirm') });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const ok = await resetPassword(parsed.data.token, parsed.data.password);
  if (!ok) return { message: 'Este link expirou ou já foi usado. Peça um novo link.' };
  redirect('/login?redefinida=1');
}
