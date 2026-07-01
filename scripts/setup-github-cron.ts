/**
 * Configura secrets do GitHub Actions para backup do cron HTTP (a cada 5 min).
 * Pré-requisito: gh auth login
 *
 * Uso: npm run github:cron:setup
 */
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const GITHUB_REPO = "9bitts/eight";

function runGh(args: string[]) {
  const result = spawnSync("gh", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`Comando falhou: gh ${args.join(" ")}`);
  }
}

function ghAuthOk(): boolean {
  const result = spawnSync("gh", ["auth", "status"], {
    stdio: "pipe",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function main() {
  console.log("=== Eight — GitHub Actions cron (backup) ===\n");

  if (!ghAuthOk()) {
    console.log("Faça login: gh auth login");
    process.exit(1);
  }

  let siteUrl = await prompt("URL do site em produção (ex: https://eight.up.railway.app): ");
  siteUrl = siteUrl.replace(/\/$/, "");

  const cronSecret = await prompt("CRON_SECRET (mesmo valor do Railway/.env): ");
  if (!cronSecret) {
    console.error("CRON_SECRET é obrigatório.");
    process.exit(1);
  }

  runGh(["secret", "set", "SITE_URL", "--body", siteUrl, "--repo", GITHUB_REPO]);
  runGh(["secret", "set", "CRON_SECRET", "--body", cronSecret, "--repo", GITHUB_REPO]);

  console.log("\nSecrets configurados. Workflow: .github/workflows/publish-scheduled.yml");
  console.log(`Dispare manualmente: gh workflow run publish-scheduled.yml --repo ${GITHUB_REPO}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
