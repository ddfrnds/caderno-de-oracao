import AuthShell from '@/components/AuthShell';
import { ForgotForm } from '@/components/AuthForms';

export const metadata = { title: 'Recuperar senha' };

export default function ForgotPage() {
  return (
    <AuthShell title="Recuperar senha" subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha.">
      <ForgotForm />
    </AuthShell>
  );
}
