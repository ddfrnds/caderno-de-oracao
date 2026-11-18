import type { Metadata, Viewport } from 'next';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/eb-garamond/400.css';
import '@fontsource/eb-garamond/400-italic.css';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/pinyon-script/400.css';
import '@fontsource/monsieur-la-doulaise/400.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Caderno de Oração', template: '%s · Caderno de Oração' },
  description: 'Uma biblioteca digital de orações: leia, guarde e compartilhe suas orações.',
};
export const viewport: Viewport = { themeColor: '#4b2a22', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
