require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (.env.local)");
  const withSeed = !process.argv.includes("--no-seed");
  const c = new Client({ connectionString: url, ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined });
  await c.connect();
  for (const f of withSeed ? ["schema.sql", "seed.sql"] : ["schema.sql"]) {
    await c.query(fs.readFileSync(path.resolve(__dirname, "../../db", f), "utf8"));
    console.log("ran", f);
  }
  await c.end();
  console.log("Database ready.");
})().catch((e) => { console.error(e.message); process.exit(1); });
