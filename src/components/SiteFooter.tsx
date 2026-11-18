export default function SiteFooter({ dark = false }: { dark?: boolean }) {
  return <footer className={`site-footer${dark ? ' dark' : ''}`}>Caderno de Oração — um lugar de fé, paz e devoção.</footer>;
}
