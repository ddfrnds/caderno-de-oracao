import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';

export default async function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="page narrow">
        <div className="paper-card">
          <h1 className="title-script">{title}</h1>
          <div className="ornament" aria-hidden="true">✦ ✦ ✦</div>
          {subtitle && <p className="subtitle">{subtitle}</p>}
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
