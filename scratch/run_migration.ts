import { createClient } from "@libsql/client";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) throw new Error("No URL");

console.log("Connecting to:", url);

const client = createClient({
  url: url,
  authToken: authToken
});

async function main() {
  const sql = fs.readFileSync("migrate.sql", "utf-8");
  console.log("Running migration...");
  await client.executeMultiple(sql);
  console.log("Migration applied successfully!");
}

main().catch(console.error);
