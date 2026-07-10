/**
 * Sincroniza o banco de produção com alterações incrementais e seguras.
 * Evita `prisma db push --accept-data-loss` quando há constraints pendentes.
 *
 * Uso: npm run db:sync
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("[db-sync] Iniciando…");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpLastUsed" TEXT
  `);
  console.log("[db-sync] User.totpLastUsed OK");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0
  `);
  console.log("[db-sync] User.sessionVersion OK");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "dedupeKey" TEXT
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "groupName" VARCHAR(80)
  `);
  console.log("[db-sync] Notification.dedupeKey/groupName OK");

  const cleared = await prisma.$executeRawUnsafe(`
    WITH ranked AS (
      SELECT id,
        ROW_NUMBER() OVER (PARTITION BY "dedupeKey" ORDER BY "createdAt" DESC) AS rn
      FROM "Notification"
      WHERE "dedupeKey" IS NOT NULL
    )
    UPDATE "Notification" n
    SET "dedupeKey" = NULL
    FROM ranked r
    WHERE n.id = r.id AND r.rn > 1
  `);
  console.log("[db-sync] dedupeKey duplicados limpos:", cleared);

  const indexExists = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'Notification'
        AND indexname = 'Notification_dedupeKey_key'
    ) AS exists
  `;

  if (!indexExists[0]?.exists) {
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey")
    `);
    console.log("[db-sync] índice único Notification_dedupeKey_key criado");
  } else {
    console.log("[db-sync] índice Notification_dedupeKey_key já existe");
  }

  console.log("[db-sync] Concluído.");
}

main()
  .catch((err) => {
    console.error("[db-sync] Falhou:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
