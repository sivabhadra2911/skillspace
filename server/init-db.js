import { readFileSync } from "node:fs";
import pg from "pg";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  options: "-c search_path=skillspace,public",
  ssl:
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: true }
      : undefined,
});
try {
  await pool.query(
    readFileSync(new URL("./schema.sql", import.meta.url), "utf8"),
  );
  console.log("Skill Space database is ready.");
} finally {
  await pool.end();
}
