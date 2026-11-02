// Opt-in live-provider smoke check. Sends only synthetic travel requests, never
// account profiles, and never opens a database or creates a booking/payment.
require('dotenv').config({ path: require('node:path').join(__dirname, '../.env'), quiet: true });
const assert = require('node:assert/strict');
const { generateAssistantReply } = require('../controllers/chat.controller');
const { vietnamToday } = require('../lib/chatAssistant');
const airports = [
  { code: 'DAD', city: 'Đà Nẵng', name: 'Đà Nẵng', country: 'Vietnam' },
  { code: 'SGN', city: 'TP. Hồ Chí Minh', name: 'Tân Sơn Nhất', country: 'Vietnam' },
  { code: 'HAN', city: 'Hà Nội', name: 'Nội Bài', country: 'Vietnam' },
  { code: 'DLI', city: 'Đà Lạt', name: 'Liên Khương', country: 'Vietnam' },
  { code: 'HUI', city: 'Huế', name: 'Phú Bài', country: 'Vietnam' },
];
async function main() {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_NOT_CONFIGURED');
  const today = vietnamToday(), next = new Date(`${today}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const tomorrow = next.toISOString().slice(0, 10);
  let draft = { from: '', to: '', date: '' };
  const history = [];
  async function ask(message) {
    if (process.argv.includes('--pace') && history.some(item => item.sender === 'user')) await new Promise(resolve => setTimeout(resolve, 22000));
    history.push({ sender: 'user', text: message });
    const answer = await generateAssistantReply(history, draft, airports);
    draft = answer.flightDraft;
    history.push({ sender: 'bot', text: answer.reply });
    console.log(JSON.stringify({ intent: answer.intent, flightDraft: draft, hasSearch: !!answer.search }));
    return answer;
  }
  if (process.argv.includes('--short-answers')) {
    let answer = await ask('Tôi muốn bay tới Hà Nội');
    assert.equal(draft.to, 'HAN'); assert.equal(answer.search, null);
    answer = await ask('tân sơn nhất');
    assert.deepEqual(draft, { from: 'SGN', to: 'HAN', date: '' }); assert.equal(answer.search, null);
    answer = await ask('mai');
    assert.deepEqual(draft, { from: 'SGN', to: 'HAN', date: tomorrow }); assert.ok(answer.search);
    console.log('PASS live Groq: destination first, airport name and one-word relative date');
    return;
  }
  if (process.argv.includes('--reported-dialogue')) {
    draft = { from: '', to: '', date: '' }; history.length = 0;
    history.push({ sender: 'bot', text: 'Bạn muốn bay từ sân bay nào? Vui lòng cho biết mã sân bay xuất phát (ví dụ: HAN, SGN, ...).' });
    let answer = await ask('tân sơn nhất');
    assert.deepEqual(draft, { from: 'SGN', to: '', date: '' });
    assert.ok(!/mã sân bay|IATA/i.test(answer.reply));
    answer = await ask('mai');
    assert.deepEqual(draft, { from: 'SGN', to: '', date: tomorrow }); assert.equal(answer.search, null);
    assert.ok(!/bay từ đâu|mã sân bay|IATA/i.test(answer.reply));
    answer = await ask('tân sơn nhất');
    assert.deepEqual(draft, { from: 'SGN', to: '', date: tomorrow });
    assert.ok(!/không được trùng|bay từ đâu|mã sân bay|IATA/i.test(answer.reply));
    answer = await ask('nội bài');
    assert.deepEqual(draft, { from: 'SGN', to: 'HAN', date: tomorrow }); assert.ok(answer.search);
    console.log('PASS live Groq: reported airport/date dialogue, repeated origin and named destination');
    return;
  }
  const first = await ask('Mình đang ở Đà Nẵng, ngày mai muốn vào Sài Gòn, tìm giúp mình một chuyến nhé');
  assert.deepEqual(draft, { from: 'DAD', to: 'SGN', date: tomorrow }); assert.ok(first.search);
  const second = await ask('À giữ ngày đó nhưng đổi sang Hà Nội nhé');
  assert.deepEqual(draft, { from: 'DAD', to: 'HAN', date: tomorrow }); assert.ok(second.search);
  const third = await ask('Mà mình lại chưa biết đi đâu nữa, thích nghỉ dưỡng nhưng không thích biển');
  assert.equal(third.intent, 'recommendation'); assert.equal(third.search, null); assert.equal(draft.from, 'DAD'); assert.equal(draft.to, '');
  console.log('PASS live Groq: semantic itinerary, contextual edit and undecided destination');
}
main().catch(error => { console.error('LIVE_GROQ_CHECK_FAILED', { name: error.name, status: error.status, code: error.code }); process.exitCode = 1; });
