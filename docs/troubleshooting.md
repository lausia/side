# Troubleshooting

Este guia ajuda a resolver problemas comuns no monorepo ENSO.

## Erros de build

### `next build` falha no `apps/web`

- Verifique se `DATABASE_URL` está configurado.
- Confirme se `NEXTAUTH_URL` e `NEXTAUTH_SECRET` estão presentes.
- Certifique-se de que `packages/database/generated/prisma` existe.
- Se o erro indicar module Prisma, rode:
  - `npm run db:generate --workspace=packages/database`
  - `npm run build --workspace=apps/web`

### `tsc` falha no `apps/bot`

- Use a versão de Node compatível com TypeScript 5.
- Verifique se `npm install` foi executado no root.
- Se faltar tipos, confira as dependências em `apps/bot/package.json`.

## Erros de dependências

### Workspaces não instalando corretamente

- Execute `npm install` no diretório raiz.
- Verifique se o `package.json` root contém `workspaces`.
- Para forçar regeneração, delete `package-lock.json` e `node_modules`, depois rode `npm install`.

### `Cannot find module '@enso/database'`

- Isso indica que o workspace não resolveu o pacote local.
- Verifique o resultado de `npm install`.
- Confirme que `packages/database` está listado nas workspaces do root.

## Erros de Prisma

### `PrismaClientInitializationError`

- Verifique `DATABASE_URL`.
- Confirme se o banco está em execução.
- Se for local, execute `docker-compose` ou PostgreSQL manualmente.

### `P2002` (unique constraint failed)

- Ocorre em operações que criam registros únicos, por exemplo `participant.phone` ou `event.slug`.
- Solução: use outro valor ou trate o erro no payload.

### Schema e client desincronizados

- Rode `npm run db:generate --workspace=packages/database` depois de alterar o schema.
- Se usar migrações:
  - `npm run db:migrate --workspace=packages/database`

## Erros de autenticação

### NextAuth não funciona

- `NEXTAUTH_URL` e `NEXTAUTH_SECRET` devem estar definidos.
- Se o browser não mantém sessão, verifique o domínio e cookies.
- O provider usado é `CredentialsProvider` em `apps/web/auth.ts`.

### Senha incorreta ou usuário não encontrado

- O credencial de login é verificado via `bcrypt.compare` com `passwordHash` no banco.
- Verifique se o utilizador existe em `User` e se o `passwordHash` foi gerado com `bcryptjs`.

## Erros de cache

- Delete `.next` no frontend se alterações não aparecerem.
- Delete `node_modules` e `package-lock.json` se dependências estiverem corrompidas.
- Rode `npm cache verify` se suspeitar de cache npm ruim.

## Problemas de workspace

### Root `npm run dev` não inicia ambos em Windows

- Em Windows PowerShell, o script com `&` pode não rodar em paralelo.
- Solução: execute `npm run dev:web` e `npm run dev:bot` em terminais separados.

### `package-lock.json` conflitante

- Existe `package-lock.json` no root e em `packages/database`.
- Ao reconstruir o ambiente, atualize o lockfile do root e, se necessário, o `packages/database/package-lock.json`.

## Problemas de Node.js

- Recomendado Node.js 20.x.
- Se o projeto gerar erros de sintaxe moderna, atualize o Node.

## Erros de deploy

### Frontend em Vercel falha na build

- Confira `apps/web` como Root Directory.
- Use o Build Command exato: `node scripts/copy-prisma-engine.mjs && next build --no-lint`.
- Verifique variáveis: `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL`.

### Backend no Railway ou outro host não conecta ao Redis

- Configure `REDIS_URL`.
- Verifique a disponibilidade da instância Redis.
- Se usar Redis interno em produção, teste a conexão localmente.

### Erros de WhatsApp

- O bot precisa de autenticação Baileys persistente.
- Verifique se a pasta `/app/auth` existe no ambiente de deploy.
- Se o bot cair em reconnect, o código reinicia automaticamente `startWhatsAppBot()`.

### Erro `Resend` ou email não enviado

- Verifique `RESEND_API_KEY`.
- Confirme que `RESEND_FROM` é válido.
- Analise respostas de erro no log do bot.

## Correções passo a passo

### Passo 1: validar dependências

```bash
npm install
npm run db:generate --workspace=packages/database
```

### Passo 2: validar banco e cache

```bash
npm run db:migrate --workspace=packages/database
npm run db:studio --workspace=packages/database
```

### Passo 3: rodar local

```bash
npm run dev:web
npm run dev:bot
```

### Passo 4: testar endpoints

- `http://localhost:3001/health`
- `http://localhost:3001/api/events`
- `http://localhost:3000/` (frontend)

### Passo 5: revisar logs e variáveis

- Se o backend falhar, verifique os erros no console.
- Se o frontend falhar, revise o build output e as variáveis do ambiente.
