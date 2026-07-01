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

## S3

- Bucket privado para o prefixo `verification/`
- Documentos de verificação usam URLs assinadas (15 min), nunca `S3_PUBLIC_URL`

## Verificação pós-deploy

```bash
npm run test
npm run build
```
