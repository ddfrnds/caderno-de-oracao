import { redirect } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { SignupForm } from '@/components/AuthForms';
import { safeNext } from '@/lib/safe-next';
import { getCurrentUser } from '@/server/auth';

export const metadata = { title: 'Cadastre-se' };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="Cadastre-se" subtitle="Crie sua conta para compartilhar orações.">
      <SignupForm next={next} />
    </AuthShell>
  );
}
