const { Pool, types } = require("pg");
require("dotenv").config();

// Existing TIMESTAMP WITHOUT TIME ZONE values represent Vietnam local time.
types.setTypeParser(1114, (value) => `${value.replace(" ", "T")}+07:00`);
types.setTypeParser(1082, (value) => value);

const connectionString = process.env.DATABASE_URL?.trim();
const sslSetting = process.env.DB_SSL?.trim().toLowerCase();
if (sslSetting && !["true", "false"].includes(sslSetting)) {
  throw new Error("DB_SSL must be true or false");
}

// Explicit DB_SSL takes precedence over TLS options embedded in DATABASE_URL.
let databaseUrl = connectionString;
if (databaseUrl && sslSetting) {
  const url = new URL(databaseUrl);
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert", "ssl"]) url.searchParams.delete(key);
  databaseUrl = url.href;
}

const pool = new Pool({
  ...(databaseUrl ? { connectionString: databaseUrl } : {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  }),

  // Render internal connections can opt out; public endpoints verify TLS.
  ssl: (sslSetting ? sslSetting === "true" : process.env.NODE_ENV === "production")
    ? { rejectUnauthorized: true }
    : false,
  connectionTimeoutMillis: 10000,

  options: "-c timezone=Asia/Ho_Chi_Minh",
});

module.exports = pool;
