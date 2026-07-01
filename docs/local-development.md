# Desenvolvimento Local

Este documento descreve como configurar e executar o monorepo ENSO localmente.

## Requisitos do sistema

- Node.js 20.x recomendado
- npm 10.x ou superior
- PostgreSQL
- Redis (para BullMQ)
- Git
- Um editor com suporte TypeScript

> O projeto usa npm workspaces e `@prisma/client` com `prisma` no root e em `packages/database`.

## Pré-configuração

1. Configure o PostgreSQL e obtenha a `DATABASE_URL`.
2. Configure o Redis e obtenha a `REDIS_URL` (opcional, padrão `redis://localhost:6379`).
3. Crie um arquivo `.env` na raiz com as variáveis mínimas. Veja `environment-variables.md`.

## Instalação de dependências

No diretório raiz do monorepo:

```bash
npm install
```

Isso instalará as dependências de todos os workspaces (`apps/web`, `apps/bot`, `packages/database`).

## Removendo dependências e caches

### Remover `node_modules`

Linux/macOS:

```bash
rm -rf node_modules packages/database/node_modules
```

Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules, packages\database\node_modules
```

### Remover package-lock.json

```bash
rm -f package-lock.json packages/database/package-lock.json
```

No Windows PowerShell:

```powershell
Remove-Item -Force package-lock.json, packages\database\package-lock.json
```

### Limpar cache npm

```bash
npm cache verify
```

## Recriar o ambiente local completo

1. Apague `node_modules` e `package-lock.json` conforme acima.
2. Execute `npm install` na raiz para recriar o lockfile e os pacotes.
3. Verifique se `packages/database/generated/prisma` está presente após generate.

## Geração de dependências e package-lock

O `npm install` no root gerenciará o lockfile principal no workspace. Se você precisar regenerar:

```bash
rm -f package-lock.json
npm install
```

## Comandos para rodar o frontend

No root:

```bash
npm run dev:web
```

ou diretamente em `apps/web`:

```bash
cd apps/web
npm run dev
```

O frontend roda por padrão em `http://localhost:3000`.

## Comandos para rodar o bot/backend

No root:

```bash
npm run dev:bot
```

ou diretamente em `apps/bot`:

```bash
cd apps/bot
npm run dev
```

O bot roda por padrão em `http://localhost:3001`.

## Comando para rodar o projeto completo

O root possui um script `dev` que tenta iniciar web e bot em paralelo:

```bash
npm run dev
```

> Atenção: em Windows PowerShell, o comando do root pode não operar corretamente. Caso haja problemas, execute o `dev:web` e `dev:bot` em terminais separados.

## Comandos de build

### Frontend

```bash
npm run build --workspace=apps/web
```

### Bot/backend

```bash
npm run build --workspace=apps/bot
```

### Database package

```bash
npm run build --workspace=packages/database
```

## Comandos do Prisma

### Gerar client

```bash
npm run db:generate --workspace=packages/database
```

### Executar migrações

```bash
npm run db:migrate --workspace=packages/database
```

### Abrir Prisma Studio

```bash
npm run db:studio --workspace=packages/database
```

## Seed local

O projeto não define um script `seed` em `packages/database/package.json`, mas existe `packages/database/seed.ts`.
Execute localmente com `tsx`:

```bash
npx tsx packages/database/seed.ts
```

## Testes locais antes do deploy

1. Verifique a conexão com o banco de dados.
2. Execute `npm run dev:web` e `npm run dev:bot`.
3. Confirme que o frontend carrega e que o backend responde em `/health`.
4. Teste a inscrição de evento e participante.
5. Confirme que as rotas do bot estão acessíveis:
   - `POST /api/participants/register`
   - `POST /api/questions`
   - `PATCH /api/events/:id/publish`

## Observações importantes

- O `apps/web` depende de `NEXT_PUBLIC_API_URL` para chamar o bot.
- O `apps/bot` depende de `REDIS_URL` para BullMQ.
- O `apps/bot` usa um path fixo `/app/auth` para o estado do WhatsApp. Garanta permissão de escrita.
