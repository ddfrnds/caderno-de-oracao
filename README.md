# Caderno de Oração

Biblioteca digital de orações: visitantes leem, usuários cadastrados enviam (texto, foto, arquivo) e o administrador analisa, edita fonte/fundo e publica.

**Stack:** Next.js 16 (App Router) · PostgreSQL (`pg`, migrações SQL em `migrations/`) · sessões em cookie httpOnly com token hasheado no banco · bcrypt · Gmail SMTP (recuperação de senha) · Vercel Blob privado (uploads em produção).

## Rodando localmente

```bash
cp .env.example .env.local      # ajuste DATABASE_URL
npm install
npm run migrate                 # aplica migrations/*.sql
ADMIN_NAME="Seu Nome" ADMIN_EMAIL=voce@exemplo.com ADMIN_PASSWORD='uma-senha-forte' npm run admin:create
npm run dev
```

Sem `GMAIL_USER`/`GMAIL_APP_PASSWORD`, em desenvolvimento o link de recuperação de senha é impresso no terminal.

## Testes

```bash
# precisa de um Postgres com o banco "caderno_test" (ou defina TEST_DATABASE_URL)
npm test
```

Cobrem validação, redirecionamento seguro, tipos de arquivo (por conteúdo), autenticação/sessões/recuperação de senha, fluxo envio → análise → publicação e regras de acesso aos arquivos.

## Deploy na Vercel

1. Crie um banco Postgres (Marketplace → Neon) e um **Blob Store privado**; conecte ao projeto (isso define `DATABASE_URL` e `BLOB_READ_WRITE_TOKEN`).
2. Defina `APP_URL` (URL pública), `GMAIL_USER`, `GMAIL_APP_PASSWORD` (senha de app do Google) e `STORAGE_DRIVER=blob`.
3. Rode `npm run migrate` e `npm run admin:create` apontando para o banco de produção (pode ser localmente com `DATABASE_URL` de produção).

## Regras de negócio

- `/enviar` exige login; visitante é levado a `/login?next=/enviar` e volta ao envio após entrar/cadastrar.
- Envios ficam **pendentes**. Aprovar cria um **rascunho** da oração; ela só aparece no site depois de **Publicar** no editor (fonte, fundo, capa, anexos). Recusadas nunca aparecem.
- Arquivos são servidos por `/api/files/[id]`: privados (dono do envio e admin) até a oração ser publicada.
- Limite de upload: 4 MB por envio (limite de corpo das funções da Vercel).
- `/admin` retorna 404 para quem não é administrador.
