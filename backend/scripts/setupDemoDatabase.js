const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");
const bcrypt = require("bcrypt");

// Deliberately do not read .env or the application's current database connection.
async function main() {
  const connection = process.env.SETUP_DATABASE_URL;
  if (!connection) throw new Error("Set SETUP_DATABASE_URL to a NEW EMPTY local airline_booking_demo[_suffix] database.");
  const url = new URL(connection);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !/^\/airline_booking_demo(?:_[a-z0-9]+)?$/.test(url.pathname)) {
    throw new Error("Setup accepts only local airline_booking_demo[_suffix] databases, never the current application database.");
  }
  const adminEmail = String(process.env.SETUP_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SETUP_ADMIN_PASSWORD || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) || password.length < 8 || Buffer.byteLength(password) > 72) {
    throw new Error("Set SETUP_ADMIN_EMAIL and SETUP_ADMIN_PASSWORD (8+ characters, at most 72 bytes).");
  }
  const client = new Client({ connectionString: connection, options: "-c timezone=Asia/Ho_Chi_Minh" });
  await client.connect();
  const read = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");
  try {
    const objects = await client.query(`SELECT count(*) FROM (
      SELECT tablename FROM pg_tables WHERE schemaname='public'
      UNION ALL SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
      WHERE n.nspname='public' AND t.typtype='e') objects`);
    if (Number(objects.rows[0].count)) throw new Error("Database is not empty. Setup stopped without changing it; create a new database.");
    await client.query("BEGIN");
    await client.query("DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='codex_user') THEN CREATE ROLE codex_user; END IF; END $$");
    await client.query(read("setup/schema.sql"));
    await client.query("INSERT INTO users(full_name,email,password_hash,phone,role) VALUES('Quản trị đồ án',$1,$2,'0900000000','ADMIN')", [adminEmail, await bcrypt.hash(password, 10)]);
    await client.query("INSERT INTO airlines(name,code) VALUES('Vietnam Airlines','VN')");
    await client.query(`INSERT INTO airports(code,name,city,country) VALUES
      ('SGN','Tân Sơn Nhất','TP. Hồ Chí Minh','Vietnam'),('HAN','Nội Bài','Hà Nội','Vietnam'),
      ('DAD','Đà Nẵng','Đà Nẵng','Vietnam'),('PQC','Phú Quốc','Phú Quốc','Vietnam'),
      ('CXR','Cam Ranh','Nha Trang','Vietnam'),('DLI','Liên Khương','Đà Lạt','Vietnam'),
      ('HUI','Phú Bài','Huế','Vietnam'),('VCA','Cần Thơ','Cần Thơ','Vietnam'),
      ('NRT','Narita','Tokyo','Japan'),('HND','Haneda','Tokyo','Japan'),('SIN','Changi','Singapore','Singapore')`);
    await client.query("COMMIT");
    const migration = read("migrations/001_account_booking_safety.sql");
    const begin = migration.indexOf("BEGIN;");
    await client.query(migration.slice(0, begin));
    await client.query(migration.slice(begin));
    for (const file of ["002_demo_flight_schedule.sql", "003_on_demand_demo_data.sql", "004_remove_replaced_tables.sql", "005_admin_booking_delete_permissions.sql", "006_customer_reviews.sql", "007_live_chat.sql"]) {
      await client.query(read(`migrations/${file}`));
    }
    await client.query("GRANT USAGE ON SCHEMA public TO codex_user");
    await client.query("GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO codex_user");
    await client.query("GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO codex_user");
    console.log("Demo setup complete: one admin, 11 airports, 12 demo planes, 240 seats. No bookings/payments created.");
    console.log("Configure backend/.env to use this database only if you want to switch to the new demo environment.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { await client.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
