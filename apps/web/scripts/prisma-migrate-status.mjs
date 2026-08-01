import {
  getDatabaseConfig,
  hasMigrationsTable,
  listLocalMigrations,
  readAppliedMigrations,
} from "./prisma-migrate-local-utils.mjs";

async function main() {
  const config = getDatabaseConfig();
  const localMigrations = await listLocalMigrations();

  if (!hasMigrationsTable(config)) {
    console.error(`No _prisma_migrations table found in ${config.database}.`);
    console.error("Run npm run db:migrate:deploy to bootstrap the local database.");
    process.exit(1);
  }

  const applied = readAppliedMigrations(config);
  const appliedMap = new Map(applied.map((migration) => [migration.migrationName, migration]));

  const pending = localMigrations.filter((migration) => !appliedMap.has(migration.name)).map((migration) => migration.name);
  const checksumMismatch = localMigrations
    .filter((migration) => appliedMap.has(migration.name) && appliedMap.get(migration.name).checksum !== migration.checksum)
    .map((migration) => migration.name);
  const unfinished = applied.filter((migration) => !migration.finished && !migration.rolledBack).map((migration) => migration.migrationName);
  const extraApplied = applied
    .filter((migration) => !localMigrations.some((localMigration) => localMigration.name === migration.migrationName))
    .map((migration) => migration.migrationName);

  const hasIssues =
    pending.length > 0 || checksumMismatch.length > 0 || unfinished.length > 0 || extraApplied.length > 0;

  console.log(`Database: ${config.database}`);
  console.log(`Local migrations: ${localMigrations.length}`);
  console.log(`Applied migrations: ${applied.length}`);

  if (pending.length > 0) {
    console.error(`Pending migrations: ${pending.join(", ")}`);
  }

  if (checksumMismatch.length > 0) {
    console.error(`Checksum mismatches: ${checksumMismatch.join(", ")}`);
  }

  if (unfinished.length > 0) {
    console.error(`Unfinished migrations: ${unfinished.join(", ")}`);
  }

  if (extraApplied.length > 0) {
    console.error(`Applied but missing locally: ${extraApplied.join(", ")}`);
  }

  if (hasIssues) {
    process.exit(1);
  }

  console.log("Local migration baseline is in sync with the database.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
