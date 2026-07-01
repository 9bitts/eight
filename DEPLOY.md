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
