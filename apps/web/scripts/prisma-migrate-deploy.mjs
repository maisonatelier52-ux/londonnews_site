import {
  buildMigrationInsertSql,
  createMigrationsTableSql,
  getDatabaseConfig,
  hasMigrationsTable,
  listLocalMigrations,
  runDockerPsql,
  runPrismaDeploy,
} from "./prisma-migrate-local-utils.mjs";

async function main() {
  const config = getDatabaseConfig();

  if (hasMigrationsTable(config)) {
    runPrismaDeploy(config.appDir);
    return;
  }

  const migrations = await listLocalMigrations();
  if (migrations.length === 0) {
    console.log("No local migrations found.");
    return;
  }

  runDockerPsql({
    capture: false,
    container: config.dockerContainer,
    database: config.database,
    sql: createMigrationsTableSql(),
    user: config.user,
  });

  for (const migration of migrations) {
    const sql = `
BEGIN;
${migration.sql}
${buildMigrationInsertSql(migration)};
COMMIT;
`.trim();

    runDockerPsql({
      capture: false,
      container: config.dockerContainer,
      database: config.database,
      sql,
      user: config.user,
    });

    console.log(`Applied ${migration.name}`);
  }

  console.log(`Applied ${migrations.length} migrations using the local Postgres bootstrap path.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
