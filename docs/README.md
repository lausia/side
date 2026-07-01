# ENSO Events OS

Documentação oficial do monorepo ENSO que combina um frontend Next.js, um backend/WhatsApp bot e um pacote de database compartilhado com Prisma.

## Visão geral do projeto

O projeto é um sistema de gestão de eventos com:

- painel administrativo e fluxo de inscrição em frontend Next.js (`apps/web`)
- API e bot WhatsApp em Node.js/Express (`apps/bot`)
- banco de dados Postgres acessado por Prisma no pacote compartilhado (`packages/database`)
- integração de IA para moderação de perguntas via Gemini
- envio de email via Resend
- jobs assíncronos com BullMQ e Redis
- comunicação em tempo real via Socket.IO

## Tecnologias utilizadas

- Node.js + npm workspaces
- TypeScript
- Next.js 15 (App Router)
- React 19
- Prisma 5
- PostgreSQL
- Express
- Socket.IO
- BullMQ + Redis
- Baileys (WhatsApp)
- Google Generative AI (`@google/generative-ai`)
- Resend
- Tailwind CSS
- bcryptjs

## Arquitetura geral

O monorepo é organizado em três blocos principais:

- `apps/web`: frontend Next.js com interface pública e administrativa
- `apps/bot`: backend API + WhatsApp bot + scheduler
- `packages/database`: pacote Prisma compartilhado entre backend e frontend

O `apps/web` usa `@enso/database` para consultas server-side e também faz requisições API para `apps/bot`.

## Estrutura do monorepo

- `package.json`: workspace root, scripts de desenvolvimento e dependência de Prisma
- `apps/bot/package.json`: scripts de dev/build/start para bot
- `apps/web/package.json`: scripts de dev/build/start/lint para frontend
- `packages/database/package.json`: scripts Prisma e build do pacote de database
- `packages/database/prisma/schema.prisma`: modelo de dados para PostgreSQL

## Descrição de cada app/package

### apps/web

Frontend Next.js responsável por:

- páginas públicas de evento e formulário de inscrição
- painel administrativo para criar eventos, gerir utilizadores, gerir participantes e moderar perguntas
- autenticação com NextAuth (Credentials)
- chamadas API para o backend bot via `NEXT_PUBLIC_API_URL`
- acesso direto à base de dados via Prisma nos componentes server-side

### apps/bot

Backend principal responsável por:

- API REST para eventos, organizações, participantes e perguntas
- exposição de `GET /health` e `GET /qr`
- conexão com WhatsApp usando Baileys
- envio de notificações por WhatsApp e email
- agendamento de lembretes e follow-ups com BullMQ + Redis
- emissão de eventos em tempo real para moderadores via Socket.IO
- moderação de perguntas por IA usando Gemini

### packages/database

Pacote compartilhado contendo:

- schema Prisma (`prisma/schema.prisma`)
- configuração customizada de migração (`prisma.config.ts`)
- cliente Prisma compartilhado (`index.ts`)
- seed script para criar uma organização e super-admin
- generated Prisma client em `generated/prisma`

## Onde encontrar os principais pontos

- `apps/bot/src/index.ts`: inicialização da API, CORS, socket e bot
- `apps/bot/src/whatsapp/bot.ts`: integração com WhatsApp + autenticação persistente
- `apps/bot/src/scheduler/scheduler.ts`: workers, lembretes e follow-ups
- `apps/bot/src/controllers`: lógica das rotas REST
- `apps/web/app`: páginas Next.js e componentes
- `apps/web/auth.ts`: configuração NextAuth
- `packages/database/prisma/schema.prisma`: modelo de dados aplicado no sistema
- `apps/web/next.config.mjs`: configuração de build standalone e tracing de Prisma
- `apps/web/scripts/copy-prisma-engine.mjs`: cópia de engine Prisma para build standalone

## Como usar esta documentação

- `architecture.md`: arquitetura detalhada, fluxo de dados e relacionamentos
- `local-development.md`: passos completos para rodar localmente
- `deploy-web.md`: deploy do frontend Next.js
- `deploy-bot.md`: deploy do backend/bot
- `environment-variables.md`: todas as variáveis esperadas e obrigatórias
- `troubleshooting.md`: problemas comuns e como corrigir
