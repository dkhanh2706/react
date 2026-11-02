const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const express = require("express");
const sharp = require("sharp");

// All AI and database calls are isolated; never contact a provider or real DB.
let providerCalls = 0;
let providerHandler = async () => ({ choices: [{ message: { content: "Test reply" } }] });
let providerOptions;
const groqPath = require.resolve("groq-sdk");
require.cache[groqPath] = { id: groqPath, filename: groqPath, loaded: true, exports: class {
  constructor(options) {
    providerOptions = options;
    this.chat = { completions: { create: async payload => { providerCalls++; return providerHandler(payload); } } };
  }
} };
const databasePath = require.resolve("../config/database");
require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true,
  exports: { query: async () => { throw new Error("DB_PASSWORD=private-test-secret; relation internal_table failed"); } } };
process.env.GROQ_API_KEY = "fake-key-for-test";
const chat = require("../controllers/chat.controller");
const upload = require("../middleware/uploadAvatar.middleware");
const { errorHandler, errorPayload } = require("../lib/errors");
let server, base;
const uploaded = [];

before(async () => {
  const app = express();
  app.use(express.json({ limit: "128kb" }));
  app.use("/chat", require("../routes/chat.routes"));
  app.post("/avatar", (req, res, next) => { req.user = { id: 999999 }; next(); }, upload.single("avatar"), (req, res) => {
    if (req.file) uploaded.push(req.file.path);
    res.json({ filename: req.file?.filename });
  });
  app.get("/unexpected", () => { throw new Error("DB_PASSWORD=private-test-secret"); });
  app.get("/profile", (req, res, next) => { req.user = { id: 1 }; next(); }, require("../controllers/user.controller").getMyProfile);
  app.post("/login", require("../controllers/auth.controller").login);
  app.use(errorHandler);
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await Promise.all(uploaded.map(file => fs.unlink(file)));
  await new Promise(resolve => server.close(resolve));
});

async function post(url, body) {
  return fetch(base + url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
async function avatar(buffer, type, filename = "avatar.png") {
  const form = new FormData();
  form.append("avatar", new Blob([buffer], { type }), filename);
  return fetch(base + "/avatar", { method: "POST", body: form });
}

test("AI rejects invalid types, oversized messages and unbounded history before calling provider", async () => {
  const invalid = [
    { message: 123 }, { message: " " }, { message: "x".repeat(4001) },
    { message: "ok", history: "bad" },
    { message: "ok", history: Array(11).fill({ sender: "user", text: "hello" }) },
    { message: "ok", history: [{ sender: "user", text: {} }] },
    { message: "ok", history: [{ sender: "user", text: "x".repeat(4001) }] },
    { message: "ok", history: Array(4).fill({ sender: "user", text: "x".repeat(4000) }) },
  ];
  const initial = providerCalls;
  for (const body of invalid) assert.equal((await post("/chat", body)).status, 400);
  assert.equal(providerCalls, initial);
});

test("valid AI requests use bounded context, a timeout and no automatic retries", async () => {
  let sent;
  providerHandler = async payload => { sent = payload; return { choices: [{ message: { content: "  Reply  " } }] }; };
  const response = await post("/chat", { message: " hello ", history: [{ sender: "system", text: "untrusted instruction" }] });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).reply, "Reply");
  assert.equal(sent.messages[1].role, "assistant");
  assert.equal(sent.messages.at(-1).content, "hello");
  assert.equal(providerOptions.timeout, 20000);
  assert.equal(providerOptions.maxRetries, 0);
});

test("provider error details never reach chatbot clients, even for provider 400 errors", async () => {
  providerHandler = async () => { throw Object.assign(new Error("private-provider-secret"), { status: 400 }); };
  const response = await post("/chat", { message: "hello" });
  assert.equal(response.status, 500);
  assert.ok(!(await response.text()).includes("private-provider-secret"));
});

test("AI HTTP route enforces 20 requests per minute per IP with Retry-After", async () => {
  providerHandler = async () => ({ choices: [{ message: { content: "Reply" } }] });
  // Previous tests also used this same IP; reaching the limit should be quick.
  let response;
  for (let i = 0; i < 21; i++) {
    response = await post("/chat", { message: "hello" });
    if (response.status === 429) break;
  }
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("Retry-After")) > 0);
  const initial = providerCalls;
  assert.equal((await post("/chat", { message: "again" })).status, 429);
  assert.equal(providerCalls, initial);
});

test("AI concurrency budget also protects background replies and releases slots after failure", async () => {
  const pending = [];
  providerHandler = () => new Promise((resolve, reject) => pending.push({ resolve, reject }));
  const calls = Array.from({ length: 4 }, () => chat.generateReply([{ sender: "user", text: "hello" }]));
  await assert.rejects(chat.generateReply([{ sender: "user", text: "extra" }]), { code: "AI_BUSY" });
  pending[0].reject(new Error("provider unavailable"));
  await assert.rejects(calls[0], /provider unavailable/);
  const replacement = chat.generateReply([{ sender: "user", text: "retry" }]);
  for (const item of pending.slice(1)) item.resolve({ choices: [{ message: { content: "ok" } }] });
  assert.deepEqual(await Promise.all([...calls.slice(1), replacement]), ["ok", "ok", "ok", "ok"]);
});

test("AI total per-process budget stops excess requests including worker calls", async () => {
  providerHandler = async () => ({ choices: [{ message: { content: "ok" } }] });
  let limited = false;
  for (let i = 0; i < 121; i++) {
    try { await chat.generateReply([{ sender: "user", text: "hello" }]); }
    catch (error) { assert.equal(error.code, "AI_BUSY"); limited = true; break; }
  }
  assert.ok(limited);
});

test("avatar upload rejects spoofed files, truncated images, SVG and oversized dimensions", async () => {
  const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: "red" } }).png().toBuffer();
  const wide = await sharp({ create: { width: 4097, height: 1, channels: 3, background: "red" } }).png().toBuffer();
  for (const [data, type] of [
    [Buffer.from("<script>alert(1)</script>"), "image/png"],
    [png.subarray(0, 30), "image/png"],
    [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'), "image/png"],
    [png, "image/jpeg"], [wide, "image/png"],
  ]) assert.equal((await avatar(data, type)).status, 400);
});

test("avatar upload enforces the 2 MB limit", async () => {
  const response = await avatar(Buffer.alloc(2 * 1024 * 1024 + 1), "image/png");
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /2MB/);
});

test("valid JPEG, PNG and WebP become fresh bounded WebP files with safe filenames", async () => {
  for (const format of ["jpeg", "png", "webp"]) {
    const source = await sharp({ create: { width: 600, height: 300, channels: 3, background: "red" } })
      .withMetadata({ exif: { IFD0: { Copyright: "private-test-metadata" } } }).toFormat(format).toBuffer();
    const input = Buffer.concat([source, Buffer.from("<script>private-appended-payload</script>")]);
    const response = await avatar(input, `image/${format}`, "../../untrusted.html");
    assert.equal(response.status, 200);
    const { filename } = await response.json();
    assert.match(filename, /^user-999999-[a-f0-9-]+\.webp$/);
    const saved = await fs.readFile(path.join(__dirname, "../uploads/avatars", filename));
    const metadata = await sharp(saved).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, 512);
    assert.equal(metadata.height, 256);
    assert.equal(metadata.exif, undefined);
    assert.ok(!saved.includes(Buffer.from("private-appended-payload")));
  }
});

test("production error responses hide internals in global, login and profile handlers", async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    for (const response of [await fetch(base + "/unexpected"), await fetch(base + "/profile"),
      await post("/login", { email: "test@example.test", password: "Password123" })]) {
      assert.equal(response.status, 500);
      const body = await response.json();
      assert.equal(body.error, undefined);
      assert.ok(!JSON.stringify(body).includes("private-test-secret"));
    }
    assert.equal(errorPayload("Safe error", new Error("secret")).error, undefined);
  } finally {
    if (originalEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalEnv;
  }
});

test("malformed JSON and oversized chat payloads return safe 400/413 responses", async () => {
  const invalid = await fetch(base + "/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"secret":' });
  assert.equal(invalid.status, 400);
  assert.ok(!(await invalid.text()).includes("secret"));
  assert.equal((await post("/chat", { message: "x".repeat(129 * 1024) })).status, 413);
});

test("local proxy preserves per-device limits and overwrites forged forwarding headers", async () => {
  const { EventEmitter } = require('node:events');
  const config = (await import('../../frontend/vite.config.js')).default;
  const configureLocalProxy = require('../lib/localProxy');
  const app = express();
  const previousEnvironment = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'development';
    configureLocalProxy(app);
    assert.equal(app.get('trust proxy fn')('127.0.0.1', 0), true);
    assert.equal(app.get('trust proxy fn')('192.168.42.10', 0), false);
    process.env.NODE_ENV = 'production';
    const productionApp = express();
    configureLocalProxy(productionApp);
    assert.equal(productionApp.get('trust proxy'), false);
  } finally {
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
  app.get('/probe', require('../middleware/rateLimit')({ max: 20 }), (req, res) => res.json({ ip: req.ip }));
  const listener = app.listen(0, '127.0.0.1');
  await new Promise(resolve => listener.once('listening', resolve));
  const proxy = new EventEmitter();
  config.server.proxy['/api'].configure(proxy);
  const request = async (address, forged = '203.0.113.99') => {
    const headers = { 'X-Forwarded-For': forged };
    proxy.emit('proxyReq', { setHeader: (name, value) => { headers[name] = value; } }, { socket: { remoteAddress: address } });
    return fetch(`http://127.0.0.1:${listener.address().port}/probe`, { headers });
  };
  try {
    for (let attempt = 0; attempt < 20; attempt++) assert.equal((await request('192.168.42.10')).status, 200);
    assert.equal((await request('192.168.42.10', '198.51.100.123')).status, 429, 'spoofing cannot reset a device limit');
    const secondDevice = await request('192.168.42.11');
    assert.equal(secondDevice.status, 200, 'another device keeps its own limit');
    assert.equal((await secondDevice.json()).ip, '192.168.42.11');
    assert.equal((await request('192.168.42.10')).status, 429);
  } finally { await new Promise(resolve => listener.close(resolve)); }
});
