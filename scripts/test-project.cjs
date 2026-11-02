// Runs only isolated local databases. Never load application .env in this runner.
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const { Client } = require(path.join(root, "backend/node_modules/pg"));
const { LiveBrowser, sleep } = require(path.join(root, "frontend/test/helpers/live-browser.cjs"));
const runId = new Date().toISOString().replace(/\D/g, "");
const runDir = path.join(root, "backend/temp", `full-check-${runId}`);
fs.mkdirSync(runDir, { recursive: true });
const summaries = [];
let postgres, backend, browser;
const pgBin = process.env.POSTGRES_BIN || path.join(require("node:os").homedir(), "PostgreSQL", "bin");
const pgExe = name => path.join(pgBin, name + (process.platform === "win32" ? ".exe" : ""));
const logs = [];

function child(command, args, cwd, env, name) {
  const fd = fs.openSync(path.join(runDir, `${name}.log`), "w"); logs.push(fd);
  return spawn(command, args, { cwd, env: { ...process.env, ...env }, windowsHide: true, stdio: ["ignore", fd, fd] });
}
async function run(command, args, cwd, env, name) {
  const process = child(command, args, cwd, env, name);
  const code = await new Promise((resolve, reject) => { process.once("error", reject); process.once("exit", resolve); });
  const output = fs.readFileSync(path.join(runDir, `${name}.log`), "utf8");
  summaries.push({ name, exitCode: code, summary: output.split(/\r?\n/).filter(line => /^# (tests|pass|fail|duration_ms)|^not ok|^PASS|^✓ built/.test(line)) });
  console.log(`${name}: ${code === 0 ? "PASS" : "FAIL"}\n${summaries.at(-1).summary.join("\n")}`);
  if (code !== 0) throw new Error(`${name} failed; see ${path.join(runDir, name + ".log")}`);
}
async function port() { const server = net.createServer(); await new Promise(r => server.listen(0, "127.0.0.1", r)); const result = server.address().port; await new Promise(r => server.close(r)); return result; }
async function stop(process) { if (!process || process.exitCode !== null) return; const exited = new Promise(resolve => process.once("exit", resolve)); process.kill(); await exited; }
async function main() {
  const cluster = path.join(runDir, "data"), pgPort = await port();
  await run(pgExe("initdb"), ["-D", cluster, "-U", "postgres", "-A", "trust", "--no-locale", "--encoding=UTF8"], root, {}, "initdb");
  postgres = child(pgExe("postgres"), ["-D", cluster, "-p", String(pgPort), "-h", "127.0.0.1"], root, {}, "postgres");
  let db;
  for (let i = 0; i < 80; i++) {
    const attempt = new Client({ host: "127.0.0.1", port: pgPort, user: "postgres", database: "postgres" });
    try { await attempt.connect(); db = attempt; break; } catch { await attempt.end().catch(() => {}); await sleep(100); }
  }
  if (!db) throw new Error("Test PostgreSQL did not start");
  const integrationDb = `airline_booking_test_full${runId}`, chatDb = `airline_booking_test_chat${runId}`, demoDb = `airline_booking_demo_full${runId}`;
  for (const name of [integrationDb, chatDb, demoDb]) await db.query(`CREATE DATABASE "${name}"`);
  await db.end();
  if (process.argv.includes("--api-only")) {
    await run(process.execPath, ["--test", "test/avatar.test.js", "test/demoFlights.test.js", "test/security.test.js", "test/chatAssistant.test.js", "test/integration.test.js"], path.join(root, "backend"), { TEST_DATABASE_URL: `postgresql://postgres@127.0.0.1:${pgPort}/${integrationDb}` }, "backend");
    return;
  }
  if (!process.argv.includes("--live-only")) {
    await run(process.execPath, ["--test", "test/avatar.test.js", "test/demoFlights.test.js", "test/security.test.js", "test/chatAssistant.test.js", "test/integration.test.js"], path.join(root, "backend"), { TEST_DATABASE_URL: `postgresql://postgres@127.0.0.1:${pgPort}/${integrationDb}` }, "backend");
    await run(process.execPath, ["--test", "test/liveChat.test.js"], path.join(root, "backend"), { TEST_DATABASE_URL: `postgresql://postgres@127.0.0.1:${pgPort}/${chatDb}` }, "chat");
    await run(process.execPath, ["--test", "test/utils.test.js"], path.join(root, "frontend"), {}, "frontend-unit");
    await run(process.execPath, ["node_modules/eslint/bin/eslint.js", "."], path.join(root, "frontend"), {}, "lint");
    await run(process.execPath, ["node_modules/vite/bin/vite.js", "build"], path.join(root, "frontend"), {}, "build");
    await run(process.execPath, ["test/browser-smoke.cjs"], path.join(root, "frontend"), {}, "browser-fixtures");
  }
  const adminEmail = "full.admin@example.test", adminPassword = "FullAdminTest123!";
  await run(process.execPath, ["scripts/setupDemoDatabase.js"], path.join(root, "backend"), { SETUP_DATABASE_URL: `postgresql://postgres@127.0.0.1:${pgPort}/${demoDb}`, SETUP_ADMIN_EMAIL: adminEmail, SETUP_ADMIN_PASSWORD: adminPassword }, "demo-setup");
  const backendPort = await port(), backendUrl = `http://127.0.0.1:${backendPort}`;
  browser = await new LiveBrowser(backendUrl, path.join(root, "frontend/dist")).start();
  const env = { DB_HOST: "127.0.0.1", DB_PORT: String(pgPort), DB_NAME: demoDb, DB_USER: "postgres", DB_PASSWORD: "", PORT: String(backendPort), JWT_SECRET: crypto.randomBytes(32).toString("hex"), NODE_ENV: "development", FRONTEND_URL: browser.origin, DEMO_FLIGHTS_ENABLED: "true", DEMO_PAYMENTS_ENABLED: "true", MAIL_USER: "", MAIL_PASS: "", GROQ_API_KEY: "", MOMO_PARTNER_CODE: "", MOMO_ACCESS_KEY: "", MOMO_SECRET_KEY: "", MOMO_ENDPOINT: "", MOMO_REDIRECT_URL: "", MOMO_IPN_URL: "" };
  backend = child(process.execPath, ["server.js"], path.join(root, "backend"), env, "live-backend");
  for (let i = 0; i < 100; i++) { try { if ((await fetch(backendUrl + "/api/test")).ok) break; } catch { /* Wait for schema check/listener. */ } if (backend.exitCode !== null) throw new Error("Backend did not start"); await sleep(100); }
  const client = new Client({ host: "127.0.0.1", port: pgPort, user: "postgres", database: demoDb }); await client.connect();
  try {
    const result = await require(path.join(root, "frontend/test/browser-live.cjs"))({ browser, backendUrl, db: client, runDir, adminEmail, adminPassword });
    summaries.push({ name: "browser-live", ...result });
  } finally { await client.end(); }
  await browser.close(); browser = null;
  await stop(backend); backend = null;
  backend = child(process.execPath, ["server.js"], path.join(root, "backend"), { ...env, NODE_ENV: "production" }, "production-backend");
  await sleep(500);
  for (let i = 0; i < 80; i++) { try { if ((await fetch(backendUrl + "/api/test")).ok) break; } catch {} await sleep(100); }
  const assert = require("node:assert/strict");
  assert.equal((await fetch(backendUrl + "/api/uploads-test")).status, 404);
  assert.equal((await fetch(backendUrl + "/api/chat/test")).status, 404);
  assert.equal((await (await fetch(backendUrl + "/")).json()).database, undefined);
  assert.equal((await (await fetch(backendUrl + "/api/payments/config")).json()).demo_payments_enabled, false);
  assert.equal((await fetch(backendUrl + "/api/test", { headers: { Origin: "https://untrusted.example.test" } })).status, 403);
  console.log("production-gates: PASS"); summaries.push({ name: "production-gates", exitCode: 0 });
}
main().catch(error => { console.error(error); summaries.push({ name: "failure", error: error.message }); process.exitCode = 1; }).finally(async () => {
  await browser?.close(); await stop(backend);
  if (postgres && postgres.exitCode === null) {
    try { await run(pgExe("pg_ctl"), ["-D", path.join(runDir, "data"), "stop", "-m", "fast", "-w"], root, {}, "stop-postgres"); } catch { await stop(postgres); }
  }
  fs.writeFileSync(path.join(runDir, "summary.json"), JSON.stringify(summaries, null, 2));
  for (const fd of logs) fs.closeSync(fd);
  console.log(`Results: ${runDir}`);
});
