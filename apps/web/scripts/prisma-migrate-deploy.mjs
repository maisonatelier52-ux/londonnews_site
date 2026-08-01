// apps/web/scripts/prisma-migrate-deploy.mjs

import { runPrismaDeploy } from "./prisma-migrate-local-utils.mjs";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is missing");
    process.exit(1);
  }

  console.log("Running Prisma migrations...");

  runPrismaDeploy(process.cwd());

  console.log("Migration completed successfully.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});