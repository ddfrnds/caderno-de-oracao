import AuthShell from '@/components/AuthShell';
import SubmitPrayerForm from '@/components/SubmitPrayerForm';
import { requireUser } from '@/server/auth';

export const metadata = { title: 'Enviar oração' };
export const dynamic = 'force-dynamic';

export default async function SendPage() {
  await requireUser('/enviar'); // visitante sem login vai para /login?next=/enviar e volta aqui
  return (
    <AuthShell title="Enviar oração" subtitle="Escreva, cole ou anexe a oração que deseja compartilhar.">
      <SubmitPrayerForm />
    </AuthShell>
  );
}
