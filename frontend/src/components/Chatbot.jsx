import { useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import api from "../api/axios";

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
  // BOT REPLY LOCAL
  // =====================================================

  const botReply = (text, delay = 700) => {
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      addMessage("bot", text);
    }, delay);
  };

  // =====================================================
  // GROQ AI
  // =====================================================

  const askAI = async (message) => {
    try {
      setIsTyping(true);

      const history = messages.slice(-8).map((item) => ({
        sender: item.sender,

        text: item.text,
      }));

      const response = await api.post("/chat", {
        message,

        history,
      });

      const reply =
        response.data?.reply || "Xin lỗi, mình chưa thể trả lời câu hỏi này.";

      setIsTyping(false);

      addMessage("bot", reply);
    } catch (error) {
      console.error("CHATBOT AI ERROR:", error.response?.data || error);

      setIsTyping(false);

      addMessage(
        "bot",

        error.response?.data?.message ||
          "Trợ lý AI đang gặp lỗi 😅 Bạn thử lại sau nhé.",
      );
    }
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
      han: "HAN",

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

      sgn: "SGN",

      // ĐÀ NẴNG
      "đà nẵng": "DAD",
      "da nang": "DAD",
      dad: "DAD",

      // PHÚ QUỐC
      "phú quốc": "PQC",
      "phu quoc": "PQC",
      pqc: "PQC",

      // NHA TRANG
      "nha trang": "CXR",
      "cam ranh": "CXR",
      cxr: "CXR",

      // ĐÀ LẠT
      "đà lạt": "DLI",
      "da lat": "DLI",

      "liên khương": "DLI",

      "lien khuong": "DLI",

      dli: "DLI",

      // HUẾ
      huế: "HUI",
      hue: "HUI",

      "phú bài": "HUI",

      "phu bai": "HUI",

      hui: "HUI",

      // CẦN THƠ
      "cần thơ": "VCA",

      "can tho": "VCA",

      vca: "VCA",

      // TOKYO
      haneda: "HND",

      "tokyo haneda": "HND",

      hnd: "HND",

      narita: "NRT",

      "tokyo narita": "NRT",

      nrt: "NRT",

      // SINGAPORE
      singapore: "SIN",

      changi: "SIN",

      sin: "SIN",
    };

    return airports[text] || value.toUpperCase();
  };

  // =====================================================
  // NORMALIZE DATE
  // =====================================================

  const normalizeDate = (value) => {
    if (!value) {
      return "";
    }

    const text = value.trim();

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return text;
    }

    // DD/MM/YYYY
    // DD-MM-YYYY
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
  // QUICK OPTION
  // =====================================================

  const handleQuickOption = (type) => {
    if (isTyping) {
      return;
    }

    if (type === "search") {
      addMessage(
        "user",

        "✈️ Tôi muốn tìm chuyến bay",
      );

      setStep("from");

      botReply(
        "Tất nhiên rồi ✈️ Bạn muốn bay từ đâu? Ví dụ: Hà Nội, TP.HCM, Đà Nẵng...",
      );

      return;
    }

    if (type === "destination") {
      addMessage(
        "user",

        "🌴 Gợi ý điểm đến",
      );

      botReply(
        "Bạn thích kiểu chuyến đi nào? 🏖️ Biển, ⛰️ thiên nhiên, 🌆 thành phố hay 🍜 khám phá ẩm thực?",
      );

      return;
    }

    if (type === "date") {
      addMessage(
        "user",

        "📅 Tôi chưa biết ngày đi",
      );

      botReply(
        "Không sao 😊 Nếu bạn rảnh cuối tuần, mình gợi ý các chuyến ngắn 2–3 ngày như Đà Nẵng, Nha Trang, Phú Quốc hoặc Đà Lạt.",
      );

      return;
    }

    if (type === "support") {
      addMessage(
        "user",

        "☎️ Tôi cần hỗ trợ",
      );

      botReply(
        "Bạn đang cần hỗ trợ về tìm chuyến bay, đặt vé, chọn ghế, thanh toán hay quản lý đặt chỗ?",
      );
    }
  };

  // =====================================================
  // FLIGHT SEARCH STEP
  // =====================================================

  const handleFlightSearchStep = (message) => {
    // ĐIỂM ĐI
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

    // ĐIỂM ĐẾN
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
        `Tuyệt ✈️ Bạn muốn đi ${message}. Bạn dự định bay ngày nào? Ví dụ: 20/10/2026.`,
      );

      return true;
    }

    // NGÀY
    if (step === "date") {
      const normalizedDate = normalizeDate(message);

      if (!normalizedDate) {
        botReply(
          "Mình chưa hiểu ngày bay 😅 Bạn nhập theo dạng 20/10/2026 nhé.",
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
        `✅ Mình đã ghi nhận thông tin chuyến bay:

📍 Đi từ: ${newData.from}
📍 Đến: ${newData.to}
📅 Ngày đi: ${newData.date}

Bấm nút bên dưới để xem các chuyến bay phù hợp nhé.`,
        800,
      );

      return true;
    }

    return false;
  };

  // =====================================================
  // BOT RESPONSE
  // =====================================================

  const handleBotResponse = (message) => {
    const text = message.toLowerCase().trim();

    // Đang trong luồng tìm chuyến
    if (handleFlightSearchStep(message)) {
      return;
    }

    // =====================================================
    // CHÀO
    // =====================================================

    if (
      text.includes("xin chào") ||
      text === "hello" ||
      text === "hi" ||
      text === "chào" ||
      text === "alo"
    ) {
      botReply(
        "Xin chào bạn 👋 Rất vui được hỗ trợ! Bạn muốn tìm chuyến bay hay cần mình tư vấn về đặt vé?",
      );

      return;
    }

    // =====================================================
    // TÌM CHUYẾN BAY
    // =====================================================

    if (
      text.includes("tìm vé") ||
      text.includes("tìm chuyến bay") ||
      text.includes("đặt vé") ||
      text.includes("mua vé") ||
      text.includes("vé máy bay")
    ) {
      setFlightData({
        from: "",
        to: "",
        date: "",
      });

      setStep("from");

      botReply("Được nhé ✈️ Trước tiên, bạn muốn bay từ đâu?");

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
      setFlightData({
        from: "",
        to: "",
        date: "",
      });

      setStep("from");

      botReply(
        "Để kiểm tra giá vé thực tế, trước tiên bạn cho mình biết điểm đi nhé ✈️",
      );

      return;
    }

    // =====================================================
    // THANH TOÁN
    // =====================================================

    if (text === "thanh toán" || text === "payment") {
      botReply(
        "Sau khi chọn chuyến bay, nhập thông tin hành khách và chọn ghế, bạn sẽ được chuyển tới bước thanh toán.",
      );

      return;
    }

    // =====================================================
    // GHẾ
    // =====================================================

    if (text === "ghế" || text === "chọn ghế") {
      botReply(
        "Sau khi nhập thông tin hành khách, bạn có thể chọn ghế còn trống trên sơ đồ ghế trước khi thanh toán.",
      );

      return;
    }

    // =====================================================
    // MỘT SỐ GỢI Ý NHANH
    // =====================================================

    if (text.includes("biển") || text.includes("nghỉ dưỡng")) {
      botReply(
        "Nếu thích biển 🏖️, bạn có thể cân nhắc Đà Nẵng, Nha Trang hoặc Phú Quốc.",
      );

      return;
    }

    if (text.includes("núi") || text.includes("thiên nhiên")) {
      botReply(
        "Nếu thích thiên nhiên ⛰️, Đà Lạt là lựa chọn phù hợp cho chuyến đi ngắn.",
      );

      return;
    }

    // =====================================================
    // AI FALLBACK
    // Những câu khác chuyển sang Groq
    // =====================================================

    askAI(message);
  };

  // =====================================================
  // SEND MESSAGE
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
  // ENTER
  // =====================================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      handleSend();
    }
  };

  // =====================================================
  // TÌM CHUYẾN BAY THẬT
  // =====================================================

  const goToFlightSearch = async () => {
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

    try {
      setIsTyping(true);

      const response = await api.get("/flights/search", {
        params: {
          from,

          to,

          date,
        },
      });

      const flights = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setIsTyping(false);

      setOpen(false);

      navigate("/flights", {
        state: {
          flights,

          searchInfo: {
            from,

            to,

            departDate: date,
          },

          source: "chatbot",
        },
      });
    } catch (error) {
      console.error(
        "CHATBOT SEARCH FLIGHT ERROR:",
        error.response?.data || error,
      );

      setIsTyping(false);

      addMessage(
        "bot",

        error.response?.data?.message ||
          "Không thể tìm chuyến bay lúc này 😅 Bạn thử lại nhé.",
      );
    }
  };

  // =====================================================
  // RESET
  // =====================================================

  const resetChat = () => {
    setMessages([
      {
        id: Date.now(),

        sender: "bot",

        text: "Xin chào 👋 Mình là trợ lý đặt vé máy bay. Mình có thể giúp bạn tìm chuyến bay hoặc giải đáp các câu hỏi về đặt vé nhé.",
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
      {/* FLOAT BUTTON */}

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

      {/* CHATBOX */}

      {open && (
        <div className="chatbot-box">
          {/* HEADER */}

          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar-wrap">
                <div className="chatbot-avatar">
                  <i className="fa-solid fa-robot"></i>
                </div>

                <span className="avatar-status"></span>
              </div>

              <div>
                <h4>Trợ lý đặt vé</h4>

                <p>AI hỗ trợ trực tuyến</p>
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

          {/* BODY */}

          <div className="chatbot-body">
            <div className="chat-date">Hôm nay</div>

            {/* MESSAGES */}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-row ${
                  message.sender === "user" ? "user-row" : "bot-row"
                }`}
              >
                {message.sender === "bot" && (
                  <div className="message-avatar">
                    <i className="fa-solid fa-robot"></i>
                  </div>
                )}

                <div
                  className={`message ${
                    message.sender === "user" ? "user-message" : "bot-message"
                  }`}
                >
                  {String(message.text)
                    .split("\n")
                    .map((line, index, arr) => (
                      <span key={index}>
                        {line}

                        {index < arr.length - 1 && <br />}
                      </span>
                    ))}
                </div>
              </div>
            ))}

            {/* TYPING */}

            {isTyping && (
              <div className="message-row bot-row typing-row">
                <div className="message-avatar">
                  <i className="fa-solid fa-robot"></i>
                </div>

                <div className="message bot-message typing-message">
                  <span className="typing-dot"></span>

                  <span className="typing-dot"></span>

                  <span className="typing-dot"></span>
                </div>
              </div>
            )}

            {/* SEARCH BUTTON */}

            {step === "done" && !isTyping && (
              <div className="flight-search-action">
                <button type="button" onClick={goToFlightSearch}>
                  🔎 Tìm chuyến bay ngay
                </button>
              </div>
            )}

            {/* QUICK OPTION */}

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

          {/* INPUT */}

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

          {/* FOOTER */}

          <div className="chatbot-footer">Trợ lý AI hỗ trợ đặt vé ✦</div>
        </div>
      )}
    </>
  );
}

export default Chatbot;
