# Arquitetura do ENSO

## Visão geral da arquitetura

O projeto é um monorepo com três responsabilidades principais:

1. `apps/web`: frontend Next.js que serve interfaces públicas e administrativas
2. `apps/bot`: backend Express que expõe API REST, Socket.IO e WhatsApp bot
3. `packages/database`: pacote Prisma compartilhado entre frontend e backend

O design privilegia:

- separação entre interface e regras de negócio
- banco de dados centralizado em PostgreSQL
- integração em tempo real via Socket.IO
- automação de mensagens e agendamento via Redis + BullMQ
- moderação via IA usando Gemini

## Relação entre web, bot e database

### apps/web

O frontend Next.js tem duas formas de comunicação:

- Server-side: usa `@enso/database` para consultas Prisma diretamente, especialmente em páginas de evento e admin
- Cliente: chama o backend `apps/bot` via `NEXT_PUBLIC_API_URL` para operações de inscrição, gestão de eventos e moderação

### apps/bot

O bot backend é o ponto central de coordenação:

- consulta e atualiza o banco `PostgreSQL` via `@enso/database`
- expõe rotas REST sob `/api/events`, `/api/participants`, `/api/questions` e `/api/organizations`
- mantém uma instância Socket.IO para atualizações de perguntas em tempo real
- usa BullMQ para agendar lembretes e follow-ups
- envia mensagens WhatsApp com Baileys
- envia emails com Resend

### packages/database

Este pacote contém o modelo de dados do sistema e exporta o cliente Prisma:

- `prisma/schema.prisma`: modelo de dados principal
- `index.ts`: instancia `PrismaClient` e mantém cache global em dev
- `prisma.config.ts`: configuração customizada de migração com `@prisma/adapter-pg`

Ele é importado tanto por `apps/web` quanto por `apps/bot`.

## Fluxo geral do sistema

1. O organizador cria um evento no frontend administrativo (`apps/web`)
2. O evento é salvo no backend/bot via API ou diretamente pelo Prisma no frontend
3. O público acessa `apps/web/app/e/[slug]` e submete inscrição
4. O backend cria `Participant`, `EventParticipant` e agendas lembretes e follow-ups
5. O WhatsApp bot envia confirmação para o participante e usa o mensageiro para notificações futuras
6. Quando o evento está em curso, o participante pode interagir via WhatsApp com o menu de perguntas/votos
7. As perguntas são moderadas por IA no backend e os resultados são emitidos para moderadores em tempo real via Socket.IO
8. O moderador vê as perguntas no dashboard `apps/web/app/moderar/[eventId]`

## Dependências compartilhadas

- `@enso/database`: pacote Prisma interno compartilhado
- `bcryptjs`: usado em web para autenticação e em database/package para seed
- `@prisma/client` e `prisma`: usados em web, bot e package database

## Funcionamento do Prisma/database

O modelo `prisma/schema.prisma` define os principais objetos do sistema:

- Organization, User, Event, EventFormField
- Participant, EventParticipant, ParticipantResponse
- Question, Vote, FollowUp, MessageLog

A `datasource db` usa `provider = "postgresql"` e `url = env("DATABASE_URL")`.

### Módulo Prisma compartilhado

- `packages/database/index.ts` exporta:
  - `prisma`: instância de `PrismaClient`
  - todo o namespace do client gerado
- `packages/database/prisma.config.ts` configura a migração para PostgreSQL usando `PrismaPg`

### Geração

- `npm run db:generate --workspace=packages/database`
- `npm run db:migrate --workspace=packages/database`
- `npm run db:studio --workspace=packages/database`

## Estrutura de pastas detalhada

### `/apps/web`

- `package.json`: frontend Next.js
- `next.config.mjs`: build standalone e trace de Prisma
- `app/`: rotas e componentes do Next App Router
- `auth.ts`: configuração NextAuth
- `scripts/copy-prisma-engine.mjs`: copia engine Prisma para o bundle

### `/apps/bot`

- `package.json`: backend Express
- `src/index.ts`: inicialização do servidor API e Socket.IO
- `src/routes/`: definição das rotas REST
- `src/controllers/`: lógica de controller das rotas
- `src/whatsapp/`: integração com Baileys e socket global
- `src/scheduler/`: BullMQ e agendamento de jobs
- `src/services/`: serviços de IA, email e QR code

### `/packages/database`

- `package.json`: scripts Prisma e build
- `prisma/schema.prisma`: definição do modelo de dados
- `prisma.config.ts`: configuração de migração
- `index.ts`: export do client Prisma
- `seed.ts`: seed inicial de organização e superadmin
- `generated/prisma/`: cliente gerado por Prisma
