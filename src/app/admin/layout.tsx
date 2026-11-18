import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { requireAdmin } from '@/server/auth';

export const metadata = { title: 'Painel', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin('/admin'); // 404 para usuários comuns, login para visitantes
  return (
    <>
      <SiteHeader />
      <main className="page">{children}</main>
      <SiteFooter />
    </>
  );
}
