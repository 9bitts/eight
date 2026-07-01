# Checklist de deploy — eight (Doctor8)

## Variáveis de ambiente obrigatórias em produção

```env
# Rate limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Criptografia do totpSecret (32 bytes em base64)
# Gerar: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
TOTP_ENCRYPTION_KEY=
```

## Após deploy da criptografia TOTP (commit df35eb6+)

Rodar **uma única vez** em produção, com `TOTP_ENCRYPTION_KEY` já configurada:

```bash
npm run db:migrate-totp-secrets
```

O script é idempotente: segredos com prefixo `v1:` são ignorados. Não imprime valores de secrets.

## Prisma

- `npx prisma generate` — roda automaticamente no `postinstall` (`npm install`)
- `npx prisma db push` — só necessário quando `schema.prisma` mudar (as correções de segurança não alteraram o schema)

## S3 / object storage

- Bucket **privado** para o prefixo `verification/`
- Documentos de verificação: URLs assinadas (15 min) via `getSignedDownloadUrl` — **nunca** `S3_PUBLIC_URL`
- `S3_PUBLIC_URL` serve **somente** para uploads públicos (`uploads/`: avatares, imagens/vídeos de posts)

### Confirmação manual pós-deploy

- [ ] `S3_PUBLIC_URL` não expõe paths `verification/` no CDN/bucket
- [ ] Bucket policy não permite acesso público a `verification/*`
- [ ] Testar upload em `/verificacao` e confirmar que o link de download expira (~15 min)

## Verificação pós-deploy

```bash
npm run test
npm run build
```

## Follow-up de segurança — status

### Item 1 — Auditoria `await` em `rateLimit` ✓

- Todas as 14 chamadas em `src/` usam `await rateLimit(...)`
- `sendMessageRequest` recebeu rate limit (`message-request:${profileId}`, 20/min)
- Testes 429 (rotas HTTP): signup, check-2fa, forgot-password, reset-password, search
- Testes de bloqueio (server actions): `sendDirectMessage`, `sendMessageRequest` (lançam `Aguarde Xs.`)

### Item 2 — Migration TOTP legado ✓ (script pronto; execução manual)

Script: `scripts/migrate-encrypt-totp-secrets.ts`  
Comando: `npm run db:migrate-totp-secrets`

**Pré-requisitos antes de rodar em produção:**

1. Backup do banco de dados
2. `TOTP_ENCRYPTION_KEY` configurada (mesma chave usada pelo app em produção)
3. `DATABASE_URL` apontando para o banco alvo (via `.env` ou variável no shell)
4. Rodar **uma única vez** após deploy da criptografia TOTP (commit `df35eb6+`)

O script é idempotente, loga apenas contagens e nunca imprime secrets.

### Item 3 — PII na edição de DMs/pedidos ✓ (não aplicável)

Não existe fluxo de edição de mensagens diretas nem de pedidos de mensagem no produto (`editDirectMessage`, `editMessageRequest`, etc.). Os únicos `messageRequest.update` alteram status (aceitar/recusar), não o corpo do texto. Nenhuma mudança necessária.
