import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import { getCurrentUser } from '@/server/auth';

export default async function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const user = await getCurrentUser();
  return (
    <header className={`site-header${overlay ? ' overlay' : ''}`}>
      <Link href="/" className="brand" aria-label="Caderno de Oração — início">
        Caderno de oração
      </Link>
      <nav aria-label="Principal">
        {!overlay && (
          <span className="nav-links">
            <Link href="/oracoes">Orações</Link>
            <Link href="/enviar">Enviar oração</Link>
          </span>
        )}
        {user ? (
          <span className="user">
            {user.role === 'admin' && <Link href="/admin">Painel</Link>}
            <span className="who">Olá, {user.name.split(' ')[0]}</span>
            <form action={logoutAction}>
              <button type="submit" className="linklike btn-outline-sm">
                Sair
              </button>
            </form>
          </span>
        ) : (
          <span className="user">
            <Link href="/cadastro">Cadastre-se</Link>
            <Link href="/login" className="btn-outline-sm">
              Login
            </Link>
          </span>
        )}
      </nav>
    </header>
  );
}
