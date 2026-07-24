import { createClient } from "@libsql/client";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
  }

  const client = createClient({ url, authToken });
  const sqlFile = path.join(process.cwd(), "schema.sql");
  let sql = fs.readFileSync(sqlFile, "utf16le");
  
  // If it's actually UTF-8 (no BOM or regular ascii), try to read as utf8
  if (!sql.includes("CREATE TABLE") && !sql.includes("CREATE INDEX")) {
    sql = fs.readFileSync(sqlFile, "utf8");
  }

  // Split the SQL file by semicolons to execute statements individually
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Executing ${statements.length} SQL statements on Turso...`);

  for (const statement of statements) {
    try {
      await client.execute(statement);
    } catch (error: any) {
      if (error.message && error.message.includes("already exists")) {
        console.log(`Skipped: Table/Index already exists.`);
      } else {
        console.error(`Error executing: ${statement.substring(0, 50)}...`);
        console.error(error);
        process.exit(1);
      }
    }
  }

  console.log("Successfully migrated Turso database!");
}

main().catch(console.error);
