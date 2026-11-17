import Link from 'next/link';
import AuthShell from '@/components/AuthShell';
import { ResetForm } from '@/components/AuthForms';
import { isResetTokenValid } from '@/server/password-reset';

export const metadata = { title: 'Nova senha' };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? '';
  const valid = token.length >= 10 && (await isResetTokenValid(token));
  return (
    <AuthShell title="Nova senha">
      {valid ? (
        <ResetForm token={token} />
      ) : (
        <>
          <div className="alert error" role="alert">Este link é inválido, expirou ou já foi usado.</div>
          <div className="form-links"><Link href="/recuperar-senha">Pedir um novo link</Link></div>
        </>
      )}
    </AuthShell>
  );
}
