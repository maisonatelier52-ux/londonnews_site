import { spawnSync } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const migrationsDir = path.join(appDir, "prisma", "migrations");
const envFiles = [path.join(appDir, ".env"), path.join(appDir, ".env.local")];

export function loadWorkspaceEnv() {
  for (const envFile of envFiles) {
    if (!existsSync(envFile)) {
      continue;
    }

    const contents = readFileSync(envFile, "utf8");
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separator = line.indexOf("=");
      if (separator <= 0) {
        continue;
      }

      const key = line.slice(0, separator).trim();
      if (process.env[key] !== undefined) {
        continue;
      }

      let value = line.slice(separator + 1).trim();
      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

export function getDatabaseConfig() {
  loadWorkspaceEnv();

  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error("DATABASE_URL is not set. Expected apps/web/.env or apps/web/.env.local to define it.");
  }

  const parsed = new URL(rawUrl);
  const protocol = parsed.protocol.replace(/:$/, "");
  if (!["postgres", "postgresql"].includes(protocol)) {
    throw new Error(`Unsupported DATABASE_URL protocol: ${parsed.protocol}`);
  }

  const database = parsed.pathname.replace(/^\/+/, "");
  if (!database) {
    throw new Error("DATABASE_URL does not include a database name.");
  }

  return {
    appDir,
    database,
    dockerContainer: process.env.LONDONNEWS_POSTGRES_CONTAINER || "londonnews-postgres",
    migrationsDir,
    user: decodeURIComponent(parsed.username || "londonnews"),
  };
}

export function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function runDockerPsql({ container, user, database, sql, capture = true }) {
  const args = [
    "exec",
    "-i",
    container,
    "psql",
    "-U",
    user,
    "-d",
    database,
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
  ];

  if (capture) {
    args.push("-qAt", "-F", "\t");
  }

  const result = spawnSync("docker", args, {
    encoding: "utf8",
    input: sql,
    stdio: capture ? ["pipe", "pipe", "pipe"] : ["pipe", "inherit", "inherit"],
  });

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "docker exec psql failed").trim());
  }

  return capture ? result.stdout.trim() : "";
}

export async function listLocalMigrations() {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const migrations = [];
  for (const name of directories) {
    const sqlPath = path.join(migrationsDir, name, "migration.sql");
    const sql = await readFile(sqlPath, "utf8");
    migrations.push({
      checksum: createHash("sha256").update(sql).digest("hex"),
      name,
      sql,
      sqlPath,
    });
  }

  return migrations;
}

export function createMigrationsTableSql() {
  return `
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" VARCHAR(36) NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);
`.trim();
}

export function buildMigrationInsertSql(migration) {
  return `
INSERT INTO "_prisma_migrations" (
  "id",
  "checksum",
  "finished_at",
  "migration_name",
  "logs",
  "rolled_back_at",
  "started_at",
  "applied_steps_count"
) VALUES (
  ${sqlLiteral(randomUUID())},
  ${sqlLiteral(migration.checksum)},
  clock_timestamp(),
  ${sqlLiteral(migration.name)},
  NULL,
  NULL,
  clock_timestamp(),
  1
);
`.trim();
}

export function hasMigrationsTable(config) {
  const output = runDockerPsql({
    capture: true,
    container: config.dockerContainer,
    database: config.database,
    sql: `
SELECT EXISTS (
  SELECT 1
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename = '_prisma_migrations'
);
`.trim(),
    user: config.user,
  });

  return output === "t";
}

export function readAppliedMigrations(config) {
  const output = runDockerPsql({
    capture: true,
    container: config.dockerContainer,
    database: config.database,
    sql: `
SELECT
  migration_name,
  checksum,
  COALESCE(finished_at IS NOT NULL, false),
  COALESCE(rolled_back_at IS NOT NULL, false),
  applied_steps_count
FROM "_prisma_migrations"
ORDER BY started_at ASC;
`.trim(),
    user: config.user,
  });

  if (!output) {
    return [];
  }

  return output.split("\n").map((line) => {
    const [migration_name, checksum, finished, rolledBack, appliedSteps] = line.split("\t");
    return {
      appliedStepsCount: Number(appliedSteps || "0"),
      checksum,
      finished: finished === "t",
      migrationName: migration_name,
      rolledBack: rolledBack === "t",
    };
  });
}

export function runPrismaDeploy(appDir) {
  const result = spawnSync("npx", ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"], {
    cwd: appDir,
    encoding: "utf8",
    env: process.env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
