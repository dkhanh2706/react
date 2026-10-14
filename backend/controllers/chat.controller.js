const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
`;

exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập nội dung.",
      });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("Thiếu GROQ_API_KEY");

      return res.status(500).json({
        message: "Chatbot AI chưa được cấu hình.",
      });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .slice(-10)
          .filter((item) => item?.text)
          .map((item) => ({
            role: item.sender === "user" ? "user" : "assistant",
            content: String(item.text),
          }))
      : [];

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",

      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },

        ...safeHistory,

        {
          role: "user",
          content: message.trim(),
        },
      ],

      temperature: 0.6,
      max_completion_tokens: 600,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({
        message: "AI không trả về nội dung.",
      });
    }

    return res.status(200).json({
      reply,
    });
  } catch (error) {
    console.error(
      "GROQ CHAT ERROR:",
      error?.response?.data || error?.message || error,
    );

    return res.status(500).json({
      message: "Trợ lý AI đang bận. Vui lòng thử lại sau.",
    });
  }
};
