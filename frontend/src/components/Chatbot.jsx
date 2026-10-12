import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/Chatbot.css";

function Chatbot() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const [input, setInput] = useState("");

  const [step, setStep] = useState("idle");

  const [isTyping, setIsTyping] = useState(false);

  const [flightData, setFlightData] = useState({
    from: "",
    to: "",
    date: "",
  });

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Xin chào 👋 Ngày mới tốt lành! Mình là trợ lý đặt vé máy bay. Hôm nay mình có thể giúp gì cho bạn?",
    },
  ]);

  const messagesEndRef = useRef(null);

  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  // =====================================================
  // THÊM TIN NHẮN
  // =====================================================

  const addMessage = (sender, text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        sender,
        text,
      },
    ]);
  };

  // =====================================================
  // BOT REPLY + TYPING EFFECT
  // =====================================================

  const botReply = (text, delay = 900) => {
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      addMessage("bot", text);
    }, delay);
  };

  // =====================================================
  // CHUYỂN TÊN THÀNH PHỐ -> MÃ SÂN BAY
  // =====================================================

  const normalizeAirport = (value) => {
    if (!value) {
      return "";
    }

    const text = value
      .toLowerCase()
      .trim()
      .replace(/\./g, "")
      .replace(/\s+/g, " ");

    const airports = {
      // HÀ NỘI
      "hà nội": "HAN",
      "ha noi": "HAN",
      hn: "HAN",
      "nội bài": "HAN",
      "noi bai": "HAN",

      // TP.HCM
      hcm: "SGN",
      tphcm: "SGN",
      "tp hcm": "SGN",
      "tp hồ chí minh": "SGN",
      "tp ho chi minh": "SGN",
      "hồ chí minh": "SGN",
      "ho chi minh": "SGN",
      "sài gòn": "SGN",
      "sai gon": "SGN",
      "tân sơn nhất": "SGN",
      "tan son nhat": "SGN",

      // ĐÀ NẴNG
      "đà nẵng": "DAD",
      "da nang": "DAD",

      // PHÚ QUỐC
      "phú quốc": "PQC",
      "phu quoc": "PQC",

      // NHA TRANG
      "nha trang": "CXR",
      "cam ranh": "CXR",

      // ĐÀ LẠT
      "đà lạt": "DLI",
      "da lat": "DLI",
      "liên khương": "DLI",
      "lien khuong": "DLI",

      // HUẾ
      huế: "HUI",
      hue: "HUI",
      "phú bài": "HUI",
      "phu bai": "HUI",

      // CẦN THƠ
      "cần thơ": "VCA",
      "can tho": "VCA",

      // TOKYO
      haneda: "HND",
      "tokyo haneda": "HND",

      narita: "NRT",
      "tokyo narita": "NRT",

      // SINGAPORE
      singapore: "SIN",
      changi: "SIN",
    };

    return airports[text] || value.toUpperCase();
  };

  // =====================================================
  // CHUYỂN NGÀY -> YYYY-MM-DD
  // =====================================================

  const normalizeDate = (value) => {
    if (!value) {
      return "";
    }

    const text = value.trim();

    // Nếu đã đúng format
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return text;
    }

    // Ví dụ:
    // 13/10/2026
    // ngày 13/10/2026
    // 13-10-2026

    const match = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);

    if (!match) {
      return "";
    }

    const day = match[1].padStart(2, "0");

    const month = match[2].padStart(2, "0");

    const year = match[3];

    return `${year}-${month}-${day}`;
  };

  // =====================================================
  // NÚT GỢI Ý NHANH
  // =====================================================

  const handleQuickOption = (type) => {
    if (isTyping) {
      return;
    }

    if (type === "search") {
      addMessage("user", "✈️ Tôi muốn tìm chuyến bay");

      setStep("from");

      botReply(
        "Tất nhiên rồi ✈️ Bạn muốn bay từ đâu? Ví dụ: Hà Nội, TP.HCM, Đà Nẵng...",
      );

      return;
    }

    if (type === "destination") {
      addMessage("user", "🌴 Gợi ý điểm đến");

      botReply(
        "Bạn thích kiểu chuyến đi nào? 🏖️ Biển, ⛰️ thiên nhiên, 🌆 thành phố hay 🍜 khám phá ẩm thực?",
      );

      return;
    }

    if (type === "date") {
      addMessage("user", "📅 Tôi chưa biết ngày đi");

      botReply(
        "Không sao 😊 Nếu bạn rảnh cuối tuần, mình gợi ý các chuyến ngắn 2–3 ngày như Đà Nẵng, Nha Trang, Phú Quốc hoặc Đà Lạt.",
      );

      return;
    }

    if (type === "support") {
      addMessage("user", "☎️ Tôi cần hỗ trợ");

      botReply(
        "Bạn đang cần hỗ trợ về tìm chuyến bay, đặt vé, thanh toán hay quản lý đặt chỗ?",
      );
    }
  };

  // =====================================================
  // XỬ LÝ LUỒNG TÌM CHUYẾN BAY
  // =====================================================

  const handleFlightSearchStep = (message) => {
    // ==========================
    // ĐIỂM ĐI
    // ==========================

    if (step === "from") {
      const airportCode = normalizeAirport(message);

      if (!airportCode) {
        botReply("Mình chưa xác định được điểm đi. Bạn thử nhập lại nhé.");

        return true;
      }

      setFlightData((prev) => ({
        ...prev,
        from: message,
      }));

      setStep("to");

      botReply(`Mình đã ghi nhận điểm đi là ${message} 👍 Bạn muốn đến đâu?`);

      return true;
    }

    // ==========================
    // ĐIỂM ĐẾN
    // ==========================

    if (step === "to") {
      const fromCode = normalizeAirport(flightData.from);

      const toCode = normalizeAirport(message);

      if (fromCode === toCode) {
        botReply(
          "Điểm đến không được trùng với điểm đi 😅 Bạn chọn một địa điểm khác nhé.",
        );

        return true;
      }

      setFlightData((prev) => ({
        ...prev,
        to: message,
      }));

      setStep("date");

      botReply(
        `Tuyệt ✈️ Bạn muốn đi ${message}. Bạn dự định bay ngày nào? Ví dụ: 13/10/2026.`,
      );

      return true;
    }

    // ==========================
    // NGÀY BAY
    // ==========================

    if (step === "date") {
      const normalizedDate = normalizeDate(message);

      if (!normalizedDate) {
        botReply(
          "Mình chưa hiểu ngày bay 😅 Bạn nhập theo dạng 13/10/2026 nhé.",
        );

        return true;
      }

      const selectedDate = new Date(`${normalizedDate}T00:00:00`);

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        botReply(
          "Ngày bay không thể là ngày đã qua 😅 Bạn chọn ngày khác nhé.",
        );

        return true;
      }

      const newData = {
        ...flightData,
        date: message,
      };

      setFlightData(newData);

      setStep("done");

      botReply(
        `✅ Mình đã ghi nhận thông tin chuyến bay:\n\n📍 Đi từ: ${newData.from}\n📍 Đến: ${newData.to}\n📅 Ngày đi: ${newData.date}\n\nBấm nút bên dưới để xem các chuyến bay phù hợp nhé.`,
        1100,
      );

      return true;
    }

    return false;
  };

  // =====================================================
  // BOT XỬ LÝ TIN NHẮN
  // =====================================================

  const handleBotResponse = (message) => {
    const text = message.toLowerCase().trim();

    // Nếu đang trong luồng tìm chuyến
    if (handleFlightSearchStep(message)) {
      return;
    }

    // =====================================================
    // CHÀO HỎI
    // =====================================================

    if (
      text.includes("xin chào") ||
      text === "hello" ||
      text === "hi" ||
      text === "chào" ||
      text === "alo"
    ) {
      botReply(
        "Xin chào bạn 👋 Rất vui được hỗ trợ! Bạn muốn tìm chuyến bay hay cần mình gợi ý điểm đến?",
      );

      return;
    }

    // =====================================================
    // TÌM VÉ
    // =====================================================

    if (
      text.includes("tìm vé") ||
      text.includes("tìm chuyến bay") ||
      text.includes("đặt vé") ||
      text.includes("mua vé") ||
      text.includes("vé máy bay")
    ) {
      setStep("from");

      botReply("Được nhé ✈️ Trước tiên, bạn muốn bay từ đâu?");

      return;
    }

    // =====================================================
    // HÀ NỘI
    // =====================================================

    if (text.includes("hà nội")) {
      botReply(
        "Hà Nội là lựa chọn rất thú vị 🏙️ Bạn muốn mình hỗ trợ tìm chuyến bay đến Hà Nội hay đi từ Hà Nội?",
      );

      return;
    }

    // =====================================================
    // ĐÀ NẴNG
    // =====================================================

    if (text.includes("đà nẵng")) {
      botReply(
        "Đà Nẵng rất hợp cho chuyến đi 3–4 ngày 🌊 Bạn có thể kết hợp Hội An và Bà Nà Hills. Bạn muốn tìm vé đến Đà Nẵng không?",
      );

      return;
    }

    // =====================================================
    // PHÚ QUỐC
    // =====================================================

    if (text.includes("phú quốc")) {
      botReply(
        "Phú Quốc rất phù hợp nếu bạn thích nghỉ dưỡng và biển 🏖️ Bạn muốn mình hỗ trợ tìm chuyến bay đến Phú Quốc không?",
      );

      return;
    }

    // =====================================================
    // NHA TRANG
    // =====================================================

    if (text.includes("nha trang")) {
      botReply(
        "Nha Trang rất hợp nếu bạn thích biển và nghỉ dưỡng 🌊 Bạn muốn đi vào khoảng thời gian nào?",
      );

      return;
    }

    // =====================================================
    // ĐÀ LẠT
    // =====================================================

    if (text.includes("đà lạt")) {
      botReply(
        "Đà Lạt phù hợp cho chuyến nghỉ ngắn 2–3 ngày 🌲 Bạn muốn đi cuối tuần hay ngày thường?",
      );

      return;
    }

    // =====================================================
    // BIỂN
    // =====================================================

    if (text.includes("biển") || text.includes("nghỉ dưỡng")) {
      botReply(
        "Nếu thích biển 🏖️, mình gợi ý Đà Nẵng, Nha Trang hoặc Phú Quốc. Bạn thích điểm nào nhất?",
      );

      return;
    }

    // =====================================================
    // THIÊN NHIÊN
    // =====================================================

    if (text.includes("núi") || text.includes("thiên nhiên")) {
      botReply(
        "Nếu thích thiên nhiên ⛰️, bạn có thể cân nhắc Đà Lạt hoặc các điểm đến phía Bắc. Bạn muốn mình gợi ý thêm không?",
      );

      return;
    }

    // =====================================================
    // CUỐI TUẦN
    // =====================================================

    if (
      text.includes("cuối tuần") ||
      text.includes("2 ngày") ||
      text.includes("3 ngày")
    ) {
      botReply(
        "Nếu chỉ có 2–3 ngày, bạn nên chọn chuyến ngắn như Đà Nẵng, Nha Trang, Đà Lạt hoặc Phú Quốc để tiết kiệm thời gian.",
      );

      return;
    }

    // =====================================================
    // GIÁ VÉ
    // =====================================================

    if (
      text.includes("giá vé") ||
      text.includes("bao nhiêu tiền") ||
      text.includes("vé rẻ")
    ) {
      setStep("from");

      botReply(
        "Để tìm giá vé phù hợp, trước tiên bạn cho mình biết điểm đi nhé ✈️",
      );

      return;
    }

    // =====================================================
    // THANH TOÁN
    // =====================================================

    if (text.includes("thanh toán") || text.includes("payment")) {
      botReply(
        "Bạn có thể thanh toán sau khi chọn chuyến bay và ghế. Nếu gặp lỗi, bạn có thể thử lại hoặc kiểm tra thông tin thanh toán.",
      );

      return;
    }

    // =====================================================
    // GHẾ
    // =====================================================

    if (text.includes("ghế") || text.includes("chọn ghế")) {
      botReply(
        "Sau khi chọn chuyến bay, bạn có thể chọn ghế còn trống trong sơ đồ ghế trước khi thanh toán.",
      );

      return;
    }

    // =====================================================
    // HỦY VÉ
    // =====================================================

    if (text.includes("hủy vé") || text.includes("hủy chuyến")) {
      botReply(
        "Bạn có thể kiểm tra vé trong mục Quản lý đặt chỗ. Chính sách hủy sẽ tùy trạng thái vé và quy định của hệ thống.",
      );

      return;
    }

    // =====================================================
    // MẶC ĐỊNH
    // =====================================================

    botReply(
      "Mình chưa hiểu rõ câu hỏi đó 😅 Bạn có thể hỏi mình về tìm chuyến bay, giá vé, điểm đến, chọn ghế hoặc thanh toán nhé.",
    );
  };

  // =====================================================
  // GỬI TIN NHẮN
  // =====================================================

  const handleSend = () => {
    const message = input.trim();

    if (!message || isTyping) {
      return;
    }

    addMessage("user", message);

    setInput("");

    handleBotResponse(message);
  };

  // =====================================================
  // ENTER SEND
  // =====================================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  // =====================================================
  // ĐI TỚI TRANG TÌM CHUYẾN BAY
  // =====================================================

  const goToFlightSearch = () => {
    const from = normalizeAirport(flightData.from);

    const to = normalizeAirport(flightData.to);

    const date = normalizeDate(flightData.date);

    if (!from || !to || !date) {
      botReply(
        "Mình chưa xác định được đầy đủ điểm đi, điểm đến hoặc ngày bay. Bạn thử nhập lại nhé 😊",
      );

      return;
    }

    if (from === to) {
      botReply("Điểm đi và điểm đến không được trùng nhau nhé 😅");

      return;
    }

    setOpen(false);

    navigate(
      `/flights?from=${encodeURIComponent(from)}&to=${encodeURIComponent(
        to,
      )}&date=${encodeURIComponent(date)}`,
    );
  };

  // =====================================================
  // RESET CHAT
  // =====================================================

  const resetChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: "bot",
        text: "Xin chào 👋 Ngày mới tốt lành! Mình có thể giúp bạn tìm chuyến bay hoặc gợi ý điểm đến nhé.",
      },
    ]);

    setStep("idle");

    setIsTyping(false);

    setFlightData({
      from: "",
      to: "",
      date: "",
    });

    setInput("");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      {/* =================================================
          NÚT CHAT
      ================================================= */}

      <div className="support">
        <button
          type="button"
          className={`support-button ${open ? "active" : ""}`}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="support-icon">{open ? "✕" : "💬"}</span>

          {!open && <span>Chat</span>}
        </button>
      </div>

      {/* =================================================
          CHATBOX
      ================================================= */}

      {open && (
        <div className="chatbot-box">
          {/* =============================================
              HEADER
          ============================================= */}

          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar-wrap">
                <div className="chatbot-avatar">
                  <i class="fa-brands fa-bots"></i>
                </div>

                <span className="avatar-status"></span>
              </div>

              <div>
                <h4>Trợ lý đặt vé</h4>

                <p>Thường phản hồi ngay</p>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                type="button"
                className="reset-button"
                onClick={resetChat}
                title="Làm mới"
              >
                ↻
              </button>

              <button
                type="button"
                className="chatbot-close"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          {/* =============================================
              BODY
          ============================================= */}

          <div className="chatbot-body">
            <div className="chat-date">Hôm nay</div>

            {/* ===========================================
                MESSAGES
            =========================================== */}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-row ${
                  message.sender === "user" ? "user-row" : "bot-row"
                }`}
              >
                {message.sender === "bot" && (
                  <div className="message-avatar">
                    <i className="fa-brands fa-bots"></i>
                  </div>
                )}

                <div
                  className={`message ${
                    message.sender === "user" ? "user-message" : "bot-message"
                  }`}
                >
                  {message.text.split("\n").map((line, index, arr) => (
                    <span key={index}>
                      {line}

                      {index < arr.length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* ===========================================
                BOT ĐANG NHẬP
            =========================================== */}

            {isTyping && (
              <div className="message-row bot-row typing-row">
                <div className="message-avatar">
                  <i class="fa-solid fa-user-message"></i>
                </div>

                <div className="message bot-message typing-message">
                  <span className="typing-dot"></span>

                  <span className="typing-dot"></span>

                  <span className="typing-dot"></span>
                </div>
              </div>
            )}

            {/* ===========================================
                NÚT TÌM CHUYẾN BAY
            =========================================== */}

            {step === "done" && !isTyping && (
              <div className="flight-search-action">
                <button type="button" onClick={goToFlightSearch}>
                  🔎 Tìm chuyến bay ngay
                </button>
              </div>
            )}

            {/* ===========================================
                QUICK OPTIONS
            =========================================== */}

            {step === "idle" && !isTyping && (
              <div className="quick-options">
                <button
                  type="button"
                  onClick={() => handleQuickOption("search")}
                >
                  ✈️ Tìm chuyến bay
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickOption("destination")}
                >
                  🌴 Gợi ý điểm đến
                </button>

                <button type="button" onClick={() => handleQuickOption("date")}>
                  📅 Tôi chưa biết ngày đi
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickOption("support")}
                >
                  ☎️ Cần hỗ trợ
                </button>
              </div>
            )}

            <div ref={messagesEndRef}></div>
          </div>

          {/* =============================================
              INPUT
          ============================================= */}

          <div className="chatbot-input-area">
            <div className="input-wrapper">
              <input
                type="text"
                value={input}
                placeholder={
                  isTyping ? "Trợ lý đang trả lời..." : "Nhập tin nhắn..."
                }
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
            </div>

            <button
              type="button"
              className="send-button"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
            >
              ➤
            </button>
          </div>

          {/* =============================================
              FOOTER
          ============================================= */}

          <div className="chatbot-footer">Trợ lý hỗ trợ đặt vé ✦</div>
        </div>
      )}
    </>
  );
}

export default Chatbot;
