const Groq = require("groq-sdk");
const { parseChatInput, boundedHistory } = require("../lib/chatInput");
const { parseFlightDraft, assistantSchema, assistantPrompt, finalizeAssistant, vietnamToday } = require('../lib/chatAssistant');

// Shared by the HTTP chatbot and the live-chat worker in this backend process.
let activeRequests = 0;
let budgetStarted = 0;
let requestsInWindow = 0;
const busyError = () => Object.assign(new Error("Trợ lý AI đang bận. Vui lòng thử lại sau."), { status: 429, code: "AI_BUSY" });

const SYSTEM_PROMPT = `
Bạn là trợ lý AI của website đặt vé máy bay.

Nhiệm vụ:
- Hỗ trợ khách hàng sử dụng website đặt vé máy bay.
- Giải thích quy trình tìm chuyến bay.
- Hướng dẫn nhập thông tin hành khách.
- Hướng dẫn chọn ghế.
- Hướng dẫn hành lý và dịch vụ bổ sung.
- Hướng dẫn thanh toán.
- Hướng dẫn xem vé đã đặt.
- Giải thích các lỗi phổ biến khi đặt vé.
- Có thể gợi ý điểm đến du lịch.

Quy tắc:
1. Luôn trả lời bằng tiếng Việt.
2. Trả lời thân thiện, dễ hiểu.
3. Không trả lời quá dài.
4. Không tự bịa giá vé hoặc chuyến bay đang tồn tại.
5. Nếu người dùng muốn tìm chuyến bay cụ thể,
   hãy hướng dẫn họ sử dụng chức năng tìm chuyến bay trên website.
6. Nếu không chắc chắn về chính sách hãng bay,
   hãy nói rằng người dùng nên kiểm tra quy định cụ thể của hãng.
7. Không yêu cầu người dùng cung cấp mật khẩu,
   mã OTP, số CVV hoặc thông tin thẻ ngân hàng.
8. Không yêu cầu người dùng nhập hoặc tra mã sân bay/IATA.
   Hãy hỏi tên thành phố hoặc tên sân bay, ví dụ Tân Sơn Nhất hay Nội Bài.
`;

async function callGroq(payload) {
  if (!process.env.GROQ_API_KEY) throw new Error('Chatbot AI chưa được cấu hình.');
  const now = Date.now();
  if (now - budgetStarted >= 60000) { budgetStarted = now; requestsInWindow = 0; }
  if (activeRequests >= 4 || requestsInWindow >= 120) throw busyError();
  activeRequests++;
  requestsInWindow++;
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 20000, maxRetries: 0 });
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      temperature: 0.6,
      max_completion_tokens: 1600,
      ...payload,
    });
    if (completion.choices?.[0]?.finish_reason === 'length') throw new Error('AI response was truncated');
    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('AI không trả về nội dung.');
    return reply;
  } finally { activeRequests--; }
}

exports.generateReply = history => callGroq({ messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...boundedHistory(history)] });

exports.generateAssistantReply = async (history, draft, airports, awaitingField = '') => {
  const today = vietnamToday();
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const strict = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'].includes(model);
  const content = await callGroq({
    messages: [{ role: 'system', content: assistantPrompt(airports, draft, today, awaitingField) }, ...boundedHistory(history)],
    temperature: 0.2,
    max_completion_tokens: 2400,
    ...(strict ? { reasoning_effort: 'low' } : {}),
    response_format: strict
      ? { type: 'json_schema', json_schema: { name: 'flight_assistant', strict: true, schema: assistantSchema(airports) } }
      : { type: 'json_object' },
  });
  return finalizeAssistant(JSON.parse(content), airports, draft, today);
};

exports.chat = async (req, res) => {
  try {
    const history = parseChatInput(req.body);
    const structured = req.body.mode === 'assistant';
    const draft = structured ? parseFlightDraft(req.body.flightDraft) : null;
    const awaitingField = req.body.awaitingField || '';
    if (structured && !['', 'from', 'to', 'date'].includes(awaitingField)) throw Object.assign(new Error('Trường đang chờ không hợp lệ.'), { status: 400, code: 'CHAT_INPUT' });

    if (!process.env.GROQ_API_KEY) {
      console.error("Thiếu GROQ_API_KEY");

      return res.status(503).json({
        message: "Chatbot AI chưa được cấu hình.",
      });
    }

    if (structured) {
      const { rows: airports } = await require('../config/database').query('SELECT code,name,city,country FROM airports ORDER BY code');
      if (!airports.length) throw new Error('Airport catalog is empty');
      return res.json(await exports.generateAssistantReply(history, draft, airports, awaitingField));
    }

    const reply = await exports.generateReply(history);

    return res.status(200).json({
      reply,
    });
  } catch (error) {
    if (error.code === "CHAT_INPUT" || error.code === "AI_BUSY") {
      if (error.status === 429) res.set("Retry-After", "60");
      return res.status(error.status).json({ message: error.message });
    }
    if (error.status === 429) {
      const retry = Number(error.headers?.get?.('retry-after') || error.headers?.['retry-after']);
      res.set('Retry-After', String(Math.max(1, Math.min(300, Math.ceil(retry || 60)))));
      return res.status(429).json({ message: 'Trợ lý AI đang nhận quá nhiều yêu cầu. Thông tin chuyến của bạn vẫn được giữ; bạn thử lại sau ít phút nhé.' });
    }
    console.error(
      "GROQ CHAT ERROR:",
      error?.response?.data || error?.message || error,
    );

    return res.status(500).json({
      message: "Trợ lý AI đang bận. Vui lòng thử lại sau.",
    });
  }
};
