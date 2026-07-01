# Deploy do Frontend Web

Este guia descreve como implantar o frontend Next.js em plataformas como Vercel ou em hospedagem genérica.

## Build do frontend

O comando de build definido no `apps/web/package.json` é:

```bash
node scripts/copy-prisma-engine.mjs && next build --no-lint
```

Isso garante que o motor Prisma necessário seja copiado para o bundle standalone.

## Configuração de Vercel

### Root Directory

Defina o diretório raiz do projeto como:

```text
apps/web
```

### Build Command

```bash
node scripts/copy-prisma-engine.mjs && next build --no-lint
```

### Output Directory

O Next.js standalone usa `output: "standalone"` no `next.config.mjs`, então a saída será gerida automaticamente pelo Next.

### Instalando dependências

O Vercel detecta automaticamente o `package.json` em `apps/web` e instala as dependências do workspace.

Se necessário, use:

```bash
npm install
```

## Variáveis de ambiente necessárias

Para o frontend funcionar corretamente, configure:

- `NEXT_PUBLIC_API_URL`: URL do backend/bot (por ex. `https://api.meudominio.com`)
- `NEXTAUTH_URL`: URL pública do app web (por ex. `https://app.meudominio.com`)
- `NEXTAUTH_SECRET`: valor de segredo para o NextAuth
- `DATABASE_URL`: conexão PostgreSQL para o lado server do Next.js

### Variáveis opcionais

- `NODE_ENV`: `production`

## Observações de configuração

- `apps/web` acessa diretamente o banco de dados via Prisma nos componentes server-side.
- Em deploy, `DATABASE_URL` deve apontar ao mesmo PostgreSQL usado pelo backend, ou a um banco compatível.
- `NEXT_PUBLIC_API_URL` deve apontar ao backend/bot exposto ao frontend.

## Possíveis erros de deploy

### Erro: `Database connection error`

Causa provável: `DATABASE_URL` incorreta ou sem acesso.

Solução:

1. Verifique se a URL PostgreSQL está correta.
2. Confirme se o servidor de banco permite conexões externas.
3. Rode `npm run db:generate --workspace=packages/database` localmente para validar o schema.

### Erro: `NEXTAUTH_URL` não definido

O NextAuth exige esta variável para criar cookies e redirecionamentos.

### Erro: `NEXT_PUBLIC_API_URL` incorreto

O frontend não conseguirá chamar as APIs REST do bot se esta variável estiver ausente.

### Erro: `Prisma engine not found`

- Confirme que `apps/web/scripts/copy-prisma-engine.mjs` foi executado.
- Verifique se o build inclui `packages/database/generated/prisma`.

## Problemas comuns de cache

- Limpe build cache se mudanças no schema Prisma não estiverem refletidas:

```bash
npm run build --workspace=apps/web
```

ou exclua localmente:

```bash
rm -rf .next
```

## Problemas de autenticação

- `NEXTAUTH_SECRET` deve ser forte e estável.
- `NEXTAUTH_URL` deve combinar com a URL pública do frontend.
- Caso o sign-in não funcione, reative os cookies e verifique o domínio.

## Troubleshooting de deploy

1. Confirme as variáveis de ambiente em Vercel.
2. Verifique `next.config.mjs` para `output: "standalone"`.
3. Se houver problemas ao rodar `next start`, use `next build` localmente e veja se o erro se repete.
4. Garanta que a pasta `packages/database/generated/prisma` exista no ambiente de build.
