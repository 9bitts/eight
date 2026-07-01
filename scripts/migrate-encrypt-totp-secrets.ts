/**
 * Migration única: criptografa totpSecret legados (sem prefixo v1:).
 * Uso: npm run db:migrate-totp-secrets
 *
 * Idempotente — segredos já migrados são ignorados.
 * Nunca imprime o valor dos secrets.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { encrypt } from "../src/lib/crypto";

const ENCRYPTED_PREFIX = "v1:";

async function main() {
  if (!process.env.TOTP_ENCRYPTION_KEY) {
    throw new Error("TOTP_ENCRYPTION_KEY não configurada");
  }

  const users = await prisma.user.findMany({
    where: { totpSecret: { not: null } },
    select: { id: true, totpSecret: true },
  });

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    const secret = user.totpSecret!;
    if (secret.startsWith(ENCRYPTED_PREFIX)) {
      skipped++;
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: encrypt(secret) },
    });
    migrated++;
  }

  console.log(
    `[migrate-totp] Concluído: ${migrated} migrado(s), ${skipped} já criptografado(s), ${users.length} com totpSecret no total.`
  );
}

main()
  .catch((err) => {
    const message = err instanceof Error ? err.message : "falha desconhecida";
    console.error(`[migrate-totp] Erro: ${message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
