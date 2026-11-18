import { redirect } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { LoginForm } from '@/components/AuthForms';
import { safeNext } from '@/lib/safe-next';
import { getCurrentUser } from '@/server/auth';

export const metadata = { title: 'Login' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; redefinida?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="Entrar" subtitle="Acesse sua conta para enviar suas orações.">
      <LoginForm next={next} notice={sp.redefinida ? 'Senha redefinida. Entre com a nova senha.' : undefined} />
    </AuthShell>
  );
}
