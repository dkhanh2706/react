const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Dedicated EMPTY database only. Never modify the application's database.
const connection = process.env.TEST_DATABASE_URL;
if (!connection) throw new Error('Set TEST_DATABASE_URL to a NEW EMPTY local airline_booking_test[_suffix] database.');
const url = new URL(connection);
if (!/^\/airline_booking_test(?:_[a-z0-9]+)?$/.test(url.pathname) || !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('An isolated local test database is required.');
Object.assign(process.env, {
  DB_HOST: url.hostname, DB_PORT: url.port || '5432', DB_NAME: url.pathname.slice(1),
  DB_USER: decodeURIComponent(url.username), DB_PASSWORD: decodeURIComponent(url.password),
  JWT_SECRET: 'live-chat-test-' + crypto.randomUUID(),
});
const db = require('../config/database');
const live = require('../services/liveChat.service');
let server, base, adminToken, otherToken, realtime;

async function request(endpoint, body = {}, token) {
  const res = await fetch(base + endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  return { httpStatus: res.status, status: res.status, ...await res.json() };
}
const visitor = c => ({ id: c.id, secret: c.secret });
const send = (c, text, requestId = crypto.randomUUID()) => request('/messages', { ...visitor(c), text, requestId });
const admin = (c, action, body = {}, token = adminToken) => request(`/admin/${c.id}`, { action, ...body }, token);
const presence = (available, token = adminToken) => request('/admin/state', available === undefined ? {} : { available }, token);
async function activeChat() {
  await presence(true);
  const c = await request('/session');
  await request('/request', visitor(c));
  assert.equal((await admin(c, 'accept')).httpStatus, 200);
  return c;
}
async function disconnect(c, elapsed) {
  await db.query("UPDATE chat_presence SET last_seen=now()-interval '5 minutes' WHERE admin_id=1");
  await db.query("UPDATE chat_conversations SET disconnected_at=now()-($2 * interval '1 millisecond') WHERE id=$1", [c.id, elapsed]);
}

before(async () => {
  assert.equal(Number((await db.query("SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")).rows[0].count), 0, 'Use a new EMPTY database.');
  await db.query(`CREATE TABLE users(id SERIAL PRIMARY KEY,role TEXT NOT NULL,is_locked BOOLEAN DEFAULT false,token_version INTEGER DEFAULT 0,is_primary_admin BOOLEAN DEFAULT false);
    INSERT INTO users(role) VALUES('ADMIN'),('ADMIN'),('CUSTOMER')`);
  const migration = fs.readFileSync(path.join(__dirname, '../migrations/007_live_chat.sql'), 'utf8');
  await db.query(migration);
  await db.query(migration); // Safe to reapply.
  const jwt = require('jsonwebtoken');
  adminToken = jwt.sign({ id: 1, token_version: 0 }, process.env.JWT_SECRET);
  otherToken = jwt.sign({ id: 2, token_version: 0 }, process.env.JWT_SECRET);
  const app = require('express')();
  app.use(require('express').json());
  app.use(require('../routes/chat.routes'));
  app.use((err, req, res, next) => { res.status(500).json({ message: err.message }); });
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  realtime = require('../services/chatRealtime.service').attachChatRealtime(server, { path: '/live', allowedOrigins: ['http://localhost:5173'] });
});
after(async () => {
  realtime?.close();
  await live.transaction(async () => {});
  if (server) await new Promise(resolve => server.close(resolve));
  await db.end();
});

test('grace period changes state exactly at 60 seconds after detection', () => {
  const lostAt = Date.now();
  assert.equal(live.ADMIN_RECONNECT_GRACE_MS, 60_000);
  assert.equal(live.connectionState(lostAt, null, lostAt), 'connected');
  assert.equal(live.connectionState(lostAt, lostAt, lostAt + 59999), 'disconnected');
  assert.equal(live.connectionState(lostAt, lostAt, lostAt + 60000), 'expired');
});

test('visitor isolation, admin authorization and offline queue behavior', async () => {
  const c = await request('/session');
  assert.equal(c.httpStatus, 200);
  assert.equal(c.secret_hash, undefined);
  assert.equal((await request('/sync', { id: c.id, secret: 'wrong' })).status, 403);
  assert.equal((await request('/admin/state')).status, 401);
  const customer = require('jsonwebtoken').sign({ id: 3, token_version: 0 }, process.env.JWT_SECRET);
  assert.equal((await presence(true, customer)).status, 403);
  assert.equal((await request('/request', visitor(c))).status, 409);
  assert.equal((await admin(c, 'accept')).status, 409);
  await presence(true);
  assert.equal((await request('/request', visitor(c))).status, 'waiting');
  assert.equal((await request('/cancel', visitor(c))).status, 'bot');
});

test('only one admin claims a conversation; old bot completions stay suppressed', async () => {
  await presence(true); await presence(true, otherToken);
  const c = await request('/session');
  await request('/request', visitor(c));
  const outcomes = await Promise.all([admin(c, 'accept'), admin(c, 'accept', {}, otherToken)]);
  assert.deepEqual(outcomes.map(r => r.status === 409 ? 409 : 200).sort(), [200, 409]);
  const current = await request('/sync', visitor(c));
  assert.equal(current.status, 'active');
  const blocked = await request('/bot', { ...visitor(c), version: 0, text: 'stale bot answer' });
  assert.ok(!blocked.messages.some(m => m.text === 'stale bot answer'));
  const ownerToken = current.admin_id === 1 ? adminToken : otherToken;
  await admin(c, 'end', {}, ownerToken);
  const afterEnd = await request('/bot', { ...visitor(c), version: 0, text: 'late answer after end' });
  assert.ok(!afterEnd.messages.some(m => m.text === 'late answer after end'));
});

test('turning availability off keeps the current conversation active and sends are idempotent', async () => {
  const c = await activeChat();
  await presence(false);
  const customer = await send(c, 'Khách vẫn nhắn được');
  assert.equal(customer.status, 'active');
  const requestId = crypto.randomUUID();
  const body = { text: 'Nhân viên vẫn trả lời được', requestId };
  await admin(c, 'send', body);
  const result = await admin(c, 'send', body);
  assert.equal(result.messages.filter(m => m.text === body.text).length, 1);
  await send(c, 'Tin mới sau phản hồi nhân viên');
  await admin(c, 'send', body); // A retry of the old reply must not consume the new question.
  assert.equal((await db.query("SELECT pending FROM chat_messages WHERE conversation_id=$1 AND sender='user' ORDER BY id DESC LIMIT 1", [c.id])).rows[0].pending, true);
  assert.equal((await admin(c, 'send', body, otherToken)).status, 409);
  await admin(c, 'end');
  await live.answerPending(async () => 'Đã trả lời tin mới');
});

test('disconnect detection posts a notice; reconnect within grace retains ownership', async () => {
  const c = await activeChat();
  await db.query("UPDATE chat_presence SET last_seen=now()-interval '20 seconds' WHERE admin_id=1");
  const lost = await request('/sync', visitor(c));
  assert.equal(lost.status, 'active');
  assert.ok(lost.disconnected_at);
  assert.ok(lost.messages.some(m => m.text.includes('60 giây')));
  const again = await request('/sync', visitor(c));
  assert.equal(again.messages.length, lost.messages.length);
  await disconnect(c, 58000);
  await presence();
  const restored = await request('/sync', visitor(c));
  assert.equal(restored.status, 'active');
  assert.equal(restored.disconnected_at, null);
  await admin(c, 'end');
});

test('after 60 seconds the bot answers waiting messages; admin must explicitly accept again', async () => {
  const c = await activeChat();
  await send(c, 'Tôi cần kiểm tra vé trong lúc nhân viên mất mạng');
  await disconnect(c, 61000);
  const expired = await request('/sync', visitor(c));
  assert.equal(expired.status, 'ended');
  assert.equal(expired.admin_id, null);
  assert.ok(expired.messages.some(m => m.text.includes('gián đoạn kết nối')));
  await presence();
  assert.equal((await admin(c, 'send', { text: 'late admin', requestId: crypto.randomUUID() })).status, 409);
  let receivedHistory;
  await live.answerPending(async history => { receivedHistory = history; return 'Bot đã tiếp tục hỗ trợ'; });
  const answered = await request('/sync', visitor(c));
  assert.ok(receivedHistory.some(m => m.text.includes('trong lúc')));
  assert.equal(answered.messages.at(-1).text, 'Bot đã tiếp tục hỗ trợ');
  await live.answerPending(async () => { throw new Error('Must not answer twice'); });
  assert.equal((await request('/sync', visitor(c))).messages.length, answered.messages.length);
  assert.equal((await admin(c, 'accept')).status, 'active');
  await admin(c, 'end');
});

test('claiming while fallback AI is in flight discards its response', async () => {
  const c = await activeChat();
  await send(c, 'Câu hỏi chưa được trả lời');
  await disconnect(c, 61000);
  await request('/sync', visitor(c));
  let release, started;
  const began = new Promise(resolve => { started = resolve; });
  const completion = live.answerPending(async () => { started(); return new Promise(resolve => { release = resolve; }); });
  await began;
  await presence(true);
  await admin(c, 'accept');
  release('This bot reply must be discarded');
  await completion;
  const current = await request('/sync', visitor(c));
  assert.ok(!current.messages.some(m => m.text === 'This bot reply must be discarded'));
  await admin(c, 'end');
});

test('unread counts are separate for each admin and clear when the conversation is viewed', async () => {
  const c = await activeChat();
  await send(c, 'Tin nhắn mới cần đọc');
  const first = await presence();
  assert.equal(first.conversations.find(item => item.id === c.id).unread, 1);
  await admin(c);
  assert.equal((await presence()).conversations.find(item => item.id === c.id).unread, 0);
  assert.equal((await presence(undefined, otherToken)).conversations.find(item => item.id === c.id).unread, 1);
  await admin(c, 'end');
});

test('the background sweep releases ownership without a visitor request', async () => {
  const c = await activeChat();
  await send(c, 'Tin nhắn chờ xử lý nền');
  await disconnect(c, 61000);
  await live.transaction(live.sweep);
  assert.equal((await db.query('SELECT status FROM chat_conversations WHERE id=$1', [c.id])).rows[0].status, 'ended');
  await live.answerPending(async () => 'Đã trả lời bằng worker');
  assert.equal((await request('/sync', visitor(c))).messages.at(-1).text, 'Đã trả lời bằng worker');
});

test('bodyless admin heartbeat and conversation reads succeed without changing availability', async () => {
  const c = await request('/session');
  // Axios removes Content-Type too when the request has no data.
  const headers = { Authorization: `Bearer ${adminToken}` };
  for (const available of [false, true]) {
    await presence(available);
    await db.query("UPDATE chat_presence SET last_seen=now()-interval '5 minutes' WHERE admin_id=1");
    // Axios post(url) sends no payload; express.json() leaves req.body undefined.
    const heartbeat = await fetch(base + '/admin/state', { method: 'POST', headers });
    assert.equal(heartbeat.status, 200);
    assert.equal((await heartbeat.json()).available, available);
    const saved = (await db.query('SELECT available,last_seen FROM chat_presence WHERE admin_id=1')).rows[0];
    assert.equal(saved.available, available);
    assert.ok(Date.now() - +new Date(saved.last_seen) < 5000);
    const detail = await fetch(base + `/admin/${c.id}`, { method: 'POST', headers });
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).id, c.id);
  }
  const missingCredentials = await fetch(base + '/sync', { method: 'POST' });
  assert.equal(missingCredentials.status, 403);
});

const WebSocket = require('ws');
function socket(credentials, origin = 'http://localhost:5173') {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(base.replace('http:', 'ws:') + '/live', { origin });
    ws.messages = [];
    ws.on('open', () => ws.send(JSON.stringify({ type: 'auth', ...credentials })));
    ws.on('message', raw => {
      const data = JSON.parse(raw.toString());
      ws.messages.push(data);
      if (data.type === 'ready') resolve(ws);
    });
    ws.on('error', reject);
    ws.on('close', code => reject(Object.assign(new Error('Closed: ' + code), { code })));
  });
}
async function waitUntil(check, timeout = 3000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 15));
  }
  assert.fail('Timed out waiting for chat state');
}
const closeSocket = ws => new Promise(resolve => { ws.once('close', resolve); ws.close(); });

test('WebSocket checks origin, admin JWT and visitor secret; persisted messages trigger live updates', async () => {
  await assert.rejects(socket({ token: adminToken }, 'https://untrusted.example'), /403/);
  await assert.rejects(socket({ token: 'wrong' }), error => error.code === 4401);
  const customer = require('jsonwebtoken').sign({ id: 3, token_version: 0 }, process.env.JWT_SECRET);
  await assert.rejects(socket({ token: customer }), error => error.code === 4401);
  const c = await request('/session');
  await assert.rejects(socket({ id: c.id, secret: 'wrong' }), error => error.code === 4401);
  const ws = await socket(visitor(c));
  await send(c, 'Tin nhắn được cập nhật qua WebSocket');
  await waitUntil(() => ws.messages.some(m => m.type === 'changed'));
  const snapshot = await request('/sync', visitor(c));
  assert.equal(snapshot.messages.at(-1).text, 'Tin nhắn được cập nhật qua WebSocket');
  await closeSocket(ws);
});

test('two admin tabs share availability; only closing the last tab starts the 60s grace', async () => {
  await presence(false, otherToken);
  const c = await activeChat();
  const first = await socket({ token: adminToken });
  const second = await socket({ token: adminToken });
  await closeSocket(first);
  await live.transaction(async () => {});
  assert.equal((await request('/sync', visitor(c))).status, 'active');
  assert.equal((await request('/sync', visitor(c))).disconnected_at, null);
  assert.equal((await request('/sync', visitor(c))).available, true);
  // The browser client does not send timer-based heartbeats. Server ping/pong
  // renews presence even while a tab is idle or showing a different route.
  await db.query("UPDATE chat_presence SET last_seen=now()-interval '20 seconds' WHERE admin_id=1");
  await waitUntil(async () => Date.now() - +new Date((await db.query('SELECT last_seen FROM chat_presence WHERE admin_id=1')).rows[0].last_seen) < 3000, 7000);
  await closeSocket(second);
  await waitUntil(async () => !!(await db.query('SELECT disconnected_at FROM chat_conversations WHERE id=$1', [c.id])).rows[0].disconnected_at);
  const lost = await request('/sync', visitor(c));
  assert.equal(lost.status, 'active');
  assert.equal(lost.available, false);
  const restored = await socket({ token: adminToken });
  const reconnected = await request('/sync', visitor(c));
  assert.equal(reconnected.status, 'active');
  assert.equal(reconnected.disconnected_at, null);
  assert.equal(reconnected.available, true);
  await admin(c, 'end');
  await closeSocket(restored);
});

test('reconnecting after grace requires accepting again; logout ends support and closes every admin tab', async () => {
  const c = await activeChat();
  const first = await socket({ token: adminToken });
  await send(c, 'Tin cần bot hỗ trợ sau đăng xuất');
  await closeSocket(first);
  await waitUntil(async () => !!(await db.query('SELECT disconnected_at FROM chat_conversations WHERE id=$1', [c.id])).rows[0].disconnected_at);
  await disconnect(c, 61000);
  const reconnected = await socket({ token: adminToken });
  assert.equal((await request('/sync', visitor(c))).status, 'ended');
  assert.equal((await admin(c, 'send', { text: 'Late admin', requestId: crypto.randomUUID() })).status, 409);
  await admin(c, 'accept');
  const otherTab = await socket({ token: adminToken });
  const closed = [reconnected, otherTab].map(ws => new Promise(resolve => ws.once('close', resolve)));
  assert.equal((await request('/admin/logout', {}, adminToken)).httpStatus, 200);
  assert.deepEqual(await Promise.all(closed), [4001, 4001]);
  const ended = await request('/sync', visitor(c));
  assert.equal(ended.status, 'ended');
  assert.equal(ended.admin_id, null);
  const state = await request('/admin/state', { readOnly: true }, adminToken);
  assert.equal(state.available, false);
  await assert.rejects(socket({ token: adminToken }), error => error.code === 4401);
  await live.answerPending(async () => 'Bot tiếp tục sau đăng xuất');
  assert.equal((await request('/sync', visitor(c))).messages.at(-1).text, 'Bot tiếp tục sau đăng xuất');
  const newToken = require('jsonwebtoken').sign({ id: 1, token_version: 0 }, process.env.JWT_SECRET, { jwtid: crypto.randomUUID() });
  const nextSession = await socket({ token: newToken });
  assert.equal((await request('/admin/state', { readOnly: true }, newToken)).available, false);
  await closeSocket(nextSession);
});
