const fail = (status, message) => { throw Object.assign(new Error(message), { status, code: "CHAT_INPUT" }); };
const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY = 10;
const MAX_CONTEXT_LENGTH = 16000;

function parseChatInput(body = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) fail(400, "Dữ liệu chat không hợp lệ.");
  const { message, history = [] } = body;
  if (typeof message !== "string" || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
    fail(400, `Tin nhắn cần có nội dung, tối đa ${MAX_MESSAGE_LENGTH} ký tự.`);
  }
  if (!Array.isArray(history) || history.length > MAX_HISTORY) fail(400, "Lịch sử chat không hợp lệ, tối đa 10 tin nhắn.");
  let length = message.length;
  const safeHistory = history.map(item => {
    if (!item || !["user", "bot", "assistant", "admin", "system"].includes(item.sender)
      || typeof item.text !== "string" || !item.text.trim() || item.text.length > MAX_MESSAGE_LENGTH) {
      fail(400, "Nội dung lịch sử chat không hợp lệ.");
    }
    length += item.text.length;
    return { sender: item.sender, text: item.text.trim() };
  });
  if (length > MAX_CONTEXT_LENGTH) fail(400, "Tổng nội dung chat không được vượt quá 16000 ký tự.");
  return [...safeHistory, { sender: "user", text: message.trim() }];
}

// Database conversations may be longer; send only bounded recent context to AI.
function boundedHistory(history) {
  const result = [];
  let remaining = MAX_CONTEXT_LENGTH;
  for (const item of history.slice(-MAX_HISTORY).reverse()) {
    if (typeof item.text !== "string" || !remaining) continue;
    const text = item.text.trim().slice(0, Math.min(MAX_MESSAGE_LENGTH, remaining));
    if (!text) continue;
    remaining -= text.length;
    result.unshift({ role: item.sender === "user" ? "user" : "assistant", content: text });
  }
  return result;
}

module.exports = { parseChatInput, boundedHistory };
