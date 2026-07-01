/**
 * Configura o serviço de cron no Railway (posts agendados).
 * Pré-requisito: npx railway login
 *
 * Uso: npm run railway:cron:setup
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const SERVICE_NAME = "eight-publish-cron";
const REPO = "9bitts/eight";
const CONFIG_PATH = "/railway.cron.toml";

function runRailway(
  args: string[],
  options?: { allowFailure?: boolean; json?: boolean }
): { status: number | null; stdout: string } {
  const result = spawnSync("npx", ["--yes", "@railway/cli", ...args], {
    encoding: "utf-8",
    stdio: options?.json ? ["inherit", "pipe", "inherit"] : "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0 && !options?.allowFailure) {
    throw new Error(`Comando falhou: railway ${args.join(" ")}`);
  }
  return { status: result.status, stdout: result.stdout ?? "" };
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
  console.log("=== Eight — setup cron Railway ===\n");

  try {
    runRailway(["whoami"]);
  } catch {
    console.log("\nFaça login no Railway primeiro:");
    console.log("  npx railway login\n");
    process.exit(1);
  }

  if (!existsSync(".railway")) {
    console.log("Vinculando ao projeto Railway (escolha o projeto eight)...");
    runRailway(["link"]);
  }

  console.log("Serviços no ambiente:");
  runRailway(["service", "list"]);

  const { stdout: servicesJson } = runRailway(["service", "list", "--json"], {
    json: true,
    allowFailure: true,
  });
  let serviceExists = false;
  if (servicesJson.trim()) {
    try {
      const services = JSON.parse(servicesJson) as Array<{ name?: string }>;
      serviceExists = services.some((s) => s.name === SERVICE_NAME);
    } catch {
      serviceExists = false;
    }
  }

  if (!serviceExists) {
    console.log(`Criando serviço '${SERVICE_NAME}'...`);
    runRailway(["add", "--service", SERVICE_NAME, "--repo", REPO, "--json"]);
  } else {
    console.log(`Serviço '${SERVICE_NAME}' já existe.`);
  }

  console.log("Conectando repositório ao serviço de cron...");
  runRailway(["service", "source", "connect", "--repo", REPO, "--service", SERVICE_NAME], {
    allowFailure: true,
  });

  console.log("Vinculando CLI ao serviço de cron...");
  runRailway(["service", "link", SERVICE_NAME]);

  console.log("\nConfigure DATABASE_URL (referência ao Postgres do projeto):");
  console.log(
    `  npx railway variable set DATABASE_URL='\${{Postgres.DATABASE_URL}}' --service ${SERVICE_NAME}`
  );
  console.log("  (substitua 'Postgres' pelo nome do seu serviço de banco no Railway)\n");
  console.log(`No Dashboard Railway → serviço '${SERVICE_NAME}' → Settings:`);
  console.log(`  Config-as-code file path: ${CONFIG_PATH}`);
  console.log("  (cronSchedule */5 * * * * UTC — vem do railway.cron.toml)\n");

  const deploy = await prompt("Fazer deploy agora? (s/N) ");
  if (deploy === "s" || deploy === "S") {
    runRailway(["up", "--service", SERVICE_NAME]);
    console.log(`Deploy iniciado. Logs: npx railway logs --service ${SERVICE_NAME}`);
  }

  console.log("\nConcluído. Teste local: npm run cron:publish-scheduled");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
