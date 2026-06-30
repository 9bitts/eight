import "dotenv/config";
import { publishDueScheduledPosts } from "../src/lib/scheduled-posts";

async function main() {
  const published = await publishDueScheduledPosts();
  console.log(`[cron] ${published} post(s) agendado(s) publicado(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[cron] erro:", err);
    process.exit(1);
  });
