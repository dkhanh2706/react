import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import useLiveChat from "./useLiveChat";
import { chatRequestId } from "../utils/chat";
import api from "../api/axios";
import { normalizeAirport, normalizeDate } from "../utils/chatFlightInput.js";
export default function useChatbot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [step, setStep] = useState("idle");
  const [isTyping, setIsTyping] = useState(false);
  const [flightData, setFlightData] = useState({
    from: "",
    to: "",
    date: ""
  });
  const [messages, setMessages] = useState([{
    id: 1,
    sender: "bot",
    text: "Xin chào 👋 Ngày mới tốt lành! Mình là trợ lý đặt vé máy bay. Hôm nay mình có thể giúp gì cho bạn?"
  }]);
  const live = useLiveChat(open, setMessages);
  const [sending, setSending] = useState(false);
  const pendingSend = useRef(null);
  const botTimer = useRef(null);
  const humanActive = live.session?.status === "active";
  const botBusy = isTyping && !humanActive;
  useEffect(() => () => clearTimeout(botTimer.current), []);
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, isTyping]);
  const addMessage = async (sender, text, version) => {
    if (live.current.current) {
      try {
        return await live.action(sender === "user" ? "messages" : "bot", {
          text,
          version: version ?? live.current.current.version,
          ...(sender === "user" ? {
            requestId: chatRequestId()
          } : {})
        });
      } catch (error) {
        live.setError(error.response?.data?.message || "Không gửi được tin nhắn. Vui lòng thử lại.");
        return null;
      }
    }
    setMessages(prev => [...prev, {
      id: chatRequestId(),
      sender,
      text
    }]);
    return null;
  };
  const botReply = (text, delay = 700) => {
    const version = live.current.current?.version;
    setIsTyping(true);
    clearTimeout(botTimer.current);
    botTimer.current = setTimeout(async () => {
      await addMessage("bot", text, version);
      setIsTyping(false);
    }, delay);
  };
  const askAI = async message => {
    const version = live.current.current?.version;
    try {
      setIsTyping(true);
      const history = messages.slice(-8).map(item => ({
        sender: item.sender,
        text: item.text
      }));
      const response = await api.post("/chat", {
        message,
        history
      });
      const reply = response.data?.reply || "Xin lỗi, mình chưa thể trả lời câu hỏi này.";
      setIsTyping(false);
      await addMessage("bot", reply, version);
    } catch (error) {
      console.error("CHATBOT AI ERROR:", error.response?.data || error);
      setIsTyping(false);
      addMessage("bot", error.response?.data?.message || "Trợ lý AI đang gặp lỗi 😅 Bạn thử lại sau nhé.", version);
    }
  };
  const handleQuickOption = async type => {
    if (isTyping || sending || humanActive || live.connecting) {
      return;
    }
    setSending(true);
    try {
      if (type === "search") {
        const result = await addMessage("user", "✈️ Tôi muốn tìm chuyến bay");
        if (live.current.current && (!result || result.status === "active")) return;
        setStep("from");
        botReply("Tất nhiên rồi ✈️ Bạn muốn bay từ đâu? Ví dụ: Hà Nội, TP.HCM, Đà Nẵng...");
        return;
      }
      if (type === "destination") {
        const result = await addMessage("user", "🌴 Gợi ý điểm đến");
        if (live.current.current && (!result || result.status === "active")) return;
        botReply("Bạn thích kiểu chuyến đi nào? 🏖️ Biển, ⛰️ thiên nhiên, 🌆 thành phố hay 🍜 khám phá ẩm thực?");
        return;
      }
      if (type === "date") {
        const result = await addMessage("user", "📅 Tôi chưa biết ngày đi");
        if (live.current.current && (!result || result.status === "active")) return;
        botReply("Không sao 😊 Nếu bạn rảnh cuối tuần, mình gợi ý các chuyến ngắn 2–3 ngày như Đà Nẵng, Nha Trang, Phú Quốc hoặc Đà Lạt.");
        return;
      }
      if (type === "support") {
        const result = await addMessage("user", "☎️ Tôi cần hỗ trợ");
        if (live.current.current && (!result || result.status === "active")) return;
        botReply("Bạn đang cần hỗ trợ về tìm chuyến bay, đặt vé, chọn ghế, thanh toán hay quản lý đặt chỗ?");
      }
    } finally {
      setSending(false);
    }
  };
  const handleFlightSearchStep = message => {
    // ĐIỂM ĐI
    if (step === "from") {
      const airportCode = normalizeAirport(message);
      if (!airportCode) {
        botReply("Mình chưa xác định được điểm đi. Bạn thử nhập lại nhé.");
        return true;
      }
      setFlightData(prev => ({
        ...prev,
        from: message
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
        botReply("Điểm đến không được trùng với điểm đi 😅 Bạn chọn một địa điểm khác nhé.");
        return true;
      }
      setFlightData(prev => ({
        ...prev,
        to: message
      }));
      setStep("date");
      botReply(`Tuyệt ✈️ Bạn muốn đi ${message}. Bạn dự định bay ngày nào? Ví dụ: 20/10/2026.`);
      return true;
    }

    // NGÀY
    if (step === "date") {
      const normalizedDate = normalizeDate(message);
      if (!normalizedDate) {
        botReply("Mình chưa hiểu ngày bay 😅 Bạn nhập theo dạng 20/10/2026 nhé.");
        return true;
      }
      const selectedDate = new Date(`${normalizedDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        botReply("Ngày bay không thể là ngày đã qua 😅 Bạn chọn ngày khác nhé.");
        return true;
      }
      const newData = {
        ...flightData,
        date: message
      };
      setFlightData(newData);
      setStep("done");
      botReply(`✅ Mình đã ghi nhận thông tin chuyến bay:

📍 Đi từ: ${newData.from}
📍 Đến: ${newData.to}
📅 Ngày đi: ${newData.date}

Bấm nút bên dưới để xem các chuyến bay phù hợp nhé.`, 800);
      return true;
    }
    return false;
  };
  const handleBotResponse = message => {
    const text = message.toLowerCase().trim();

    // Đang trong luồng tìm chuyến
    if (handleFlightSearchStep(message)) {
      return;
    }
    if (text.includes("xin chào") || text === "hello" || text === "hi" || text === "chào" || text === "alo") {
      botReply("Xin chào bạn 👋 Rất vui được hỗ trợ! Bạn muốn tìm chuyến bay hay cần mình tư vấn về đặt vé?");
      return;
    }
    if (text.includes("tìm vé") || text.includes("tìm chuyến bay") || text.includes("đặt vé") || text.includes("mua vé") || text.includes("vé máy bay")) {
      setFlightData({
        from: "",
        to: "",
        date: ""
      });
      setStep("from");
      botReply("Được nhé ✈️ Trước tiên, bạn muốn bay từ đâu?");
      return;
    }
    if (text.includes("giá vé") || text.includes("bao nhiêu tiền") || text.includes("vé rẻ")) {
      setFlightData({
        from: "",
        to: "",
        date: ""
      });
      setStep("from");
      botReply("Để kiểm tra giá vé thực tế, trước tiên bạn cho mình biết điểm đi nhé ✈️");
      return;
    }
    if (text === "thanh toán" || text === "payment") {
      botReply("Sau khi chọn chuyến bay, nhập thông tin hành khách và chọn ghế, bạn sẽ được chuyển tới bước thanh toán.");
      return;
    }
    if (text === "ghế" || text === "chọn ghế") {
      botReply("Sau khi nhập thông tin hành khách, bạn có thể chọn ghế còn trống trên sơ đồ ghế trước khi thanh toán.");
      return;
    }
    if (text.includes("biển") || text.includes("nghỉ dưỡng")) {
      botReply("Nếu thích biển 🏖️, bạn có thể cân nhắc Đà Nẵng, Nha Trang hoặc Phú Quốc.");
      return;
    }
    if (text.includes("núi") || text.includes("thiên nhiên")) {
      botReply("Nếu thích thiên nhiên ⛰️, Đà Lạt là lựa chọn phù hợp cho chuyến đi ngắn.");
      return;
    }
    askAI(message);
  };
  const handleSend = async () => {
    const message = input.trim();
    if (!message || botBusy || sending || live.connecting) return;
    setSending(true);
    try {
      let result;
      if (live.current.current) {
        if (pendingSend.current?.text !== message) pendingSend.current = {
          text: message,
          requestId: chatRequestId()
        };
        result = await live.action("messages", pendingSend.current);
        pendingSend.current = null;
      } else {
        await addMessage("user", message);
      }
      setInput("");
      if (result?.status !== "active") handleBotResponse(message);else setStep("idle");
    } catch (error) {
      live.setError(error.response?.data?.message || "Chưa gửi được. Nội dung được giữ lại để bạn thử lại.");
    } finally {
      setSending(false);
    }
  };
  const requestStaff = async () => {
    try {
      await live.action(live.session?.status === "waiting" ? "cancel" : "request");
    } catch (error) {
      live.setError(error.response?.data?.message || error.message);
    }
  };
  const handleKeyDown = event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };
  const goToFlightSearch = async () => {
    const from = normalizeAirport(flightData.from);
    const to = normalizeAirport(flightData.to);
    const date = normalizeDate(flightData.date);
    if (!from || !to || !date) {
      botReply("Mình chưa xác định được đầy đủ điểm đi, điểm đến hoặc ngày bay. Bạn thử nhập lại nhé 😊");
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
          date
        }
      });
      const flights = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setIsTyping(false);
      setOpen(false);
      navigate("/flights", {
        state: {
          flights,
          searchInfo: {
            from,
            to,
            departDate: date
          },
          source: "chatbot"
        }
      });
    } catch (error) {
      console.error("CHATBOT SEARCH FLIGHT ERROR:", error.response?.data || error);
      setIsTyping(false);
      addMessage("bot", error.response?.data?.message || "Không thể tìm chuyến bay lúc này 😅 Bạn thử lại nhé.");
    }
  };
  const resetChat = () => {
    clearTimeout(botTimer.current);
    setStep("idle");
    setIsTyping(false);
    setFlightData({
      from: "",
      to: "",
      date: ""
    });
    setInput("");
  };
  return {
    open,
    setOpen,
    input,
    setInput,
    step,
    isTyping,
    messages,
    live,
    sending,
    humanActive,
    botBusy,
    messagesEndRef,
    handleQuickOption,
    handleSend,
    requestStaff,
    handleKeyDown,
    goToFlightSearch,
    resetChat
  };
}
