# Deploy do Bot / Backend

Este guia aborda o deploy do backend e do bot WhatsApp localizado em `apps/bot`.

## Build do backend

O comando de build definido em `apps/bot/package.json` é:

```bash
npm run build --workspace=apps/bot
```

Isso compila o TypeScript para `dist/`.

## Configuração do Railway

No Railway, use o diretório do projeto como `apps/bot` ou configure o root para o workspace com `package.json` na raiz.

### Comandos

- Build command: `npm run build --workspace=apps/bot`
- Start command: `node dist/index.js`

### Variáveis de ambiente obrigatórias

- `DATABASE_URL`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`

### Variáveis de ambiente recomendadas

- `REDIS_URL` (default `redis://localhost:6379`)
- `FRONTEND_URL` (default `http://localhost:3000`)
- `BASE_URL` (default `http://localhost:3000`)
- `RESEND_FROM` (default `onboarding@resend.dev`)
- `PORT` (default `3001`)

## Redis / database

### Redis

O bot usa `bullmq` para agendar jobs de lembrete e follow-up. Ele depende de Redis em:

- `src/scheduler/queue.ts`

Se não for fornecido, ele tentará `redis://localhost:6379`.

### PostgreSQL

O bot acessa o mesmo banco que o frontend via `DATABASE_URL`.

## Como iniciar

### Local

```bash
cd apps/bot
npm run dev
```

### Produção

```bash
cd apps/bot
npm run build
node dist/index.js
```

## Endpoints importantes

- `GET /health`
- `GET /qr`
- `POST /api/participants/register`
- `POST /api/questions`
- `PATCH /api/events/:id/publish`
- `PATCH /api/events/:id/cancel`

## Observações sobre WhatsApp

- O bot usa Baileys e salva credenciais em `AUTH_FOLDER = "/app/auth"`.
- Em containers Docker/Linux, esse caminho deve existir e ser gravável.
- Em Windows, caminho absoluto pode causar problemas. Garanta que o diretório exista ou ajuste o código antes do deploy.

## Possíveis erros

### Erro de conexão Redis

- Verifique `REDIS_URL`.
- Confirme se o Redis está acessível.
- Valide se o firewall ou rede não bloqueia a porta.

### Erro de conexão PostgreSQL

- Verifique `DATABASE_URL`.
- Confirme que o banco aceita conexões do host de deploy.

### Falha na IA Gemini

- `GEMINI_API_KEY` deve estar definida.
- Se a API Gemini estiver indisponível, o código faz fallback aprova perguntas com score 50.

### Falha no envio de email

- `RESEND_API_KEY` deve estar definida.
- `RESEND_FROM` é opcional, mas configure um remetente válido para evitar rejeição.

### Erro `WhatsApp não conectado`

- O bot só envia mensagens se a sessão Baileys estiver ativa.
- Use `/qr` para verificar se o QR code está disponível.

## Logs

- O servidor imprime logs no console, incluindo eventos Socket.IO, jobs BullMQ e erros.
- Monitore `/health` para saber se o serviço está ativo.
- Use logs de build e runtime para identificar problemas de dependência ou autenticação.
