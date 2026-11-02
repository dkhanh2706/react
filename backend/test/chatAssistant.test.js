const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { finalizeAssistant, parseFlightDraft, vietnamToday } = require('../lib/chatAssistant');

const airports = [
  { code: 'DAD', city: 'Đà Nẵng', name: 'Đà Nẵng', country: 'Vietnam' },
  { code: 'SGN', city: 'TP. Hồ Chí Minh', name: 'Tân Sơn Nhất', country: 'Vietnam' },
  { code: 'HAN', city: 'Hà Nội', name: 'Nội Bài', country: 'Vietnam' },
  { code: 'SIN', city: 'Singapore', name: 'Changi', country: 'Singapore' },
];
const draft = { from: 'DAD', to: 'SGN', date: '2080-11-03' };
let output, sent, options, providerCalls = 0;
const groqPath = require.resolve('groq-sdk');
require.cache[groqPath] = { id: groqPath, filename: groqPath, loaded: true, exports: class {
  constructor(value) {
    options = value;
    this.chat = { completions: { create: async payload => {
      providerCalls++; sent = payload;
      if (output instanceof Error) throw output;
      return { choices: [{ finish_reason: 'stop', message: { content: typeof output === 'string' ? output : JSON.stringify(output) } }] };
    } } };
  }
} };
const dbPath = require.resolve('../config/database');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { query: async sql => {
  assert.match(sql, /^SELECT code,name,city,country FROM airports/);
  return { rows: airports };
} } };
process.env.GROQ_API_KEY = 'fake-key-for-test';
process.env.GROQ_MODEL = 'openai/gpt-oss-120b';
const controller = require('../controllers/chat.controller');
let server, base;
before(async () => {
  const app = express(); app.use(express.json({ limit: '128kb' })); app.post('/chat', controller.chat);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); });
const post = body => fetch(base + '/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'assistant', message: 'Mình đổi ý rồi, giữ ngày đó nhưng vào Sài Gòn nhé', ...body }) });
const result = (flightDraft = draft, intent = 'flight_search') => ({
  intent, reply: 'Mình đã hiểu nhu cầu của bạn.',
  updates: Object.fromEntries(Object.entries(flightDraft).map(([key, value]) => [key, value || null])),
  clearFields: Object.keys(flightDraft).filter(key => flightDraft[key] === ''), newSearch: false,
});

test('assistant calls Groq with structured schema, real airport catalog, context and Vietnam date', async () => {
  output = result();
  const response = await post({ flightDraft: { from: 'DAD', to: 'HAN', date: draft.date }, history: [{ sender: 'bot', text: 'Bạn chọn nơi nào?' }], profile: { email: 'private@example.test', document_number: '123456789012' } });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.search.url, '/flights?from=DAD&to=SGN&date=2080-11-03');
  assert.equal(sent.response_format.type, 'json_schema');
  assert.equal(sent.response_format.json_schema.strict, true);
  assert.equal(sent.reasoning_effort, 'low');
  assert.equal(options.timeout, 20000); assert.equal(options.maxRetries, 0);
  assert.ok(sent.messages[0].content.includes(vietnamToday()));
  assert.ok(sent.messages[0].content.includes('Tân Sơn Nhất'));
  assert.ok(sent.messages[0].content.includes('"to":"HAN"'));
  assert.equal(sent.messages.at(-1).content, 'Mình đổi ý rồi, giữ ngày đó nhưng vào Sài Gòn nhé');
  assert.ok(!JSON.stringify(sent).includes('private@example.test'));
  assert.ok(!JSON.stringify(sent).includes('123456789012'));
});

test('missing fields, uncertainty, support and general replies do not create a search link', async () => {
  for (const [intent, flightDraft] of [
    ['flight_search', { ...draft, to: '' }], ['flight_search', { ...draft, date: '' }],
    ['recommendation', { ...draft, to: '' }], ['support', { from: 'HAN', to: 'SIN', date: draft.date }], ['general', draft],
  ]) {
    output = result(flightDraft, intent);
    const response = await post({ flightDraft: draft });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.search, null);
    if (intent === 'support') assert.deepEqual(data.flightDraft, draft);
  }
});

test('server rejects hallucinated airports, invalid dates, expired dates and unsupported routes', () => {
  for (const flightDraft of [
    { ...draft, from: 'XYZ' }, { ...draft, date: '2080-02-31' }, { ...draft, date: '2000-01-01' },
    { ...draft, from: 'XYZ', date: '2080-02-31' },
    { ...draft, to: 'DAD' }, { ...draft, to: 'SIN' },
  ]) {
    const data = finalizeAssistant(result(flightDraft), airports, draft, '2026-11-02');
    assert.equal(data.search, null);
    assert.notDeepEqual(data.flightDraft, flightDraft);
    assert.doesNotThrow(() => parseFlightDraft(data.flightDraft));
  }
});

test('AI output cannot supply external links or override the application search action', async () => {
  output = { ...result(), url: 'https://untrusted.example', search: { url: 'https://untrusted.example' } };
  const response = await post({});
  const data = await response.json();
  assert.ok(data.search.url.startsWith('/flights?'));
  assert.ok(!JSON.stringify(data).includes('untrusted.example'));
  for (const invalid of ['broken-json', { intent: 'flight_search', reply: 'Hello', updates: null }, result({ ...draft, injected: 'secret' })]) {
    output = invalid;
    const rejected = await post({});
    assert.equal(rejected.status, 500);
    assert.equal((await rejected.json()).search, undefined);
  }
});

test('one-word date updates keep confirmed airports and only explicit clears remove them', () => {
  const previous = { from: 'SGN', to: 'HAN', date: '' };
  const patch = { intent: 'flight_search', reply: 'Ngày mai nhé.', updates: { from: null, to: null, date: '2080-11-03' }, clearFields: [], newSearch: false };
  const answer = finalizeAssistant(patch, airports, previous, '2026-11-02');
  assert.deepEqual(answer.flightDraft, { ...previous, date: '2080-11-03' });
  assert.ok(answer.search);
  const awaitingDestination = finalizeAssistant(patch, airports, { ...previous, to: '' }, '2026-11-02');
  assert.match(awaitingDestination.reply, /TP\. Hồ Chí Minh/);
  assert.match(awaitingDestination.reply, /03\/11\/2080/);
  assert.ok(!awaitingDestination.reply.includes('bay từ đâu'));
  const unsure = finalizeAssistant({ ...patch, intent: 'recommendation', updates: { from: null, to: null, date: null }, clearFields: ['to'] }, airports, answer.flightDraft, '2026-11-02');
  assert.deepEqual(unsure.flightDraft, { from: 'SGN', to: '', date: '2080-11-03' });
  assert.equal(unsure.search, null);
});

test('airport-code requests are replaced with questions using names even for general replies', () => {
  const answer = finalizeAssistant({ intent: 'general', reply: 'Bạn muốn bay từ sân bay nào? Vui lòng cho biết mã sân bay xuất phát (ví dụ: HAN, SGN).', updates: { from: null, to: null, date: null }, clearFields: [], newSearch: false }, airports, { from: '', to: 'HAN', date: '' }, '2026-11-02');
  assert.match(answer.reply, /tên thành phố hoặc sân bay/);
  assert.ok(!answer.reply.includes('mã sân bay'));
});

test('invalid client draft is rejected before contacting Groq', async () => {
  const initial = providerCalls;
  for (const flightDraft of [null, [], { from: {} }, { from: 'Atlantis' }, { date: '2080-02-31' }, { profile: 'private' }]) {
    assert.equal((await post({ flightDraft })).status, 400);
  }
  assert.equal(providerCalls, initial);
});

test('provider/configuration errors return safe responses and never a stale search link', async () => {
  output = Object.assign(new Error('private-provider-detail'), { status: 400 });
  const response = await post({ flightDraft: draft });
  assert.equal(response.status, 500);
  assert.ok(!(await response.text()).includes('private-provider-detail'));
  output = Object.assign(new Error('private-rate-limit-detail'), { status: 429, headers: { 'retry-after': '2' } });
  const limited = await post({ flightDraft: draft });
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Retry-After'), '2');
  assert.ok(!(await limited.text()).includes('private-rate-limit-detail'));
  const key = process.env.GROQ_API_KEY; delete process.env.GROQ_API_KEY;
  try { assert.equal((await post({})).status, 503); }
  finally { process.env.GROQ_API_KEY = key; }
});
