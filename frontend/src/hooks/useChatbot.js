import { useCallback, useEffect, useRef, useState } from "react";
import useLiveChat from "./useLiveChat";
import { chatRequestId } from "../utils/chat";
import api from "../api/axios";
import { normalizeAirport, normalizeDate } from "../utils/chatFlightInput.js";
import { validateChatFlight } from "../utils/chatFlightSearch.js";
import { clearChatSearch, readChatSearch, saveChatSearch } from "../utils/chatSearchState.js";
export default function useChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [initialSearch] = useState(() => readChatSearch());
  const [step, setStep] = useState(initialSearch.step);
  const [isTyping, setIsTyping] = useState(false);
  const [flightData, setFlightData] = useState(initialSearch.flightData);
  const [messages, setMessages] = useState([{
    id: 1,
    sender: "bot",
    text: "Xin chào 👋 Ngày mới tốt lành! Mình là trợ lý đặt vé máy bay. Hôm nay mình có thể giúp gì cho bạn?"
  }]);
  const [sending, setSending] = useState(false);
  const pendingSend = useRef(null);
  const botTimer = useRef(null);
  const botEpoch = useRef(0);
  const aiRequest = useRef(null);
  const clearLocalChat = useCallback(() => {
    botEpoch.current++;
    aiRequest.current?.abort();
    clearTimeout(botTimer.current);
    pendingSend.current = null;
    clearChatSearch();
    setStep("idle"); setIsTyping(false); setSending(false); setInput("");
    setFlightData({ from: "", to: "", date: "" });
  }, []);
  const live = useLiveChat(open, setMessages, clearLocalChat);
  const sessionId = live.session?.id;
  useEffect(() => {
    if (sessionId) saveChatSearch(sessionId, flightData, step);
  }, [sessionId, flightData, step]);
  const humanActive = live.session?.status === "active";
  const botBusy = isTyping && !humanActive;
  useEffect(() => () => { clearTimeout(botTimer.current); aiRequest.current?.abort(); }, []);
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, isTyping]);
  const addMessage = async (sender, text, version, sessionId) => {
    if (sessionId && sessionId !== live.current.current?.id) return null;
    if (live.current.current) {
      try {
        return await live.action(sender === "user" ? "messages" : "bot", {
          text,
          version: version ?? live.current.current.version,
          ...(sender === "user" ? {
            requestId: chatRequestId()
          } : {})
        }, sessionId);
      } catch (error) {
        live.setError(error.response?.data?.message || "Không gửi được tin nhắn. Vui lòng thử lại.");
        return null;
      }
    }
    return null;
  };
  const botReply = (text, delay = 700) => {
    const version = live.current.current?.version;
    const sessionId = live.current.current?.id, generation = botEpoch.current;
    setIsTyping(true);
    clearTimeout(botTimer.current);
    botTimer.current = setTimeout(async () => {
      if (generation !== botEpoch.current || live.current.current?.id !== sessionId) return;
      await addMessage("bot", text, version, sessionId);
      if (generation === botEpoch.current) setIsTyping(false);
    }, delay);
  };
  const askAI = async message => {
    const version = live.current.current?.version;
    const sessionId = live.current.current?.id, generation = botEpoch.current;
    const controller = new AbortController();
    aiRequest.current = controller;
    try {
      setIsTyping(true);
      let contextLength = message.length;
      const history = [];
      for (const item of messages.slice(-8).reverse()) {
        const text = String(item.text).slice(0, 4000);
        if (contextLength + text.length > 16000) break;
        contextLength += text.length;
        history.unshift({ sender: item.sender, text });
      }
      const response = await api.post("/chat", {
        mode: "assistant",
        message,
        history,
        flightDraft: flightData,
        awaitingField: ["from", "to", "date"].includes(step) ? step : "",
      }, { signal: controller.signal });
      if (controller.signal.aborted || generation !== botEpoch.current) return;
      const { reply, flightDraft, intent, search } = response.data || {};
      if (typeof reply !== "string" || !flightDraft || ["from", "to", "date"].some(key => typeof flightDraft[key] !== "string")) throw new Error("Phản hồi AI không hợp lệ.");
      const saved = await addMessage("bot", reply, version, sessionId);
      if (!saved || saved.status === "active" || controller.signal.aborted || generation !== botEpoch.current) return;
      setFlightData(flightDraft);
      const ready = search && search.from === flightDraft.from && search.to === flightDraft.to && search.date === flightDraft.date && !validateChatFlight(flightDraft);
      setStep(ready ? "done" : ["flight_search", "recommendation"].includes(intent)
        ? !flightDraft.from ? "from" : !flightDraft.to ? "to" : "date" : "idle");
    } catch (error) {
      if (controller.signal.aborted || generation !== botEpoch.current) return;
      console.error("CHATBOT AI ERROR:", error.response?.data || error);
      await addMessage("bot", error.response?.data?.message || "Trợ lý AI hiện chưa trả lời được. Bạn có thể dùng ô tìm chuyến trên trang chủ hoặc thử chat lại sau nhé.", version, sessionId);
    } finally { if (generation === botEpoch.current) setIsTyping(false); }
  };
  const handleSend = async providedMessage => {
    const message = (typeof providedMessage === "string" ? providedMessage : input).trim();
    if (!message || botBusy || sending || live.connecting || !live.session) return;
    const generation = botEpoch.current;
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
      if (generation !== botEpoch.current) return;
      setInput("");
      setStep("idle");
      if (result && result.status !== "active") await askAI(message);
    } catch (error) {
      live.setError(error.response?.data?.message || "Chưa gửi được. Nội dung được giữ lại để bạn thử lại.");
    } finally {
      if (generation === botEpoch.current) setSending(false);
    }
  };
  const handleQuickOption = type => {
    if (humanActive) return;
    const options = { search: "Tôi muốn tìm chuyến bay mới", destination: "Tôi chưa biết đi đâu, gợi ý điểm đến giúp tôi", date: "Tôi chưa biết ngày đi", support: "Tôi cần hỗ trợ" };
    if (options[type]) handleSend(options[type]);
  };
  const handleKeyDown = event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };
  const goToFlightSearch = event => {
    if (humanActive || isTyping || sending || live.connecting || !live.session) { event?.preventDefault(); return; }
    const from = normalizeAirport(flightData.from);
    const to = normalizeAirport(flightData.to);
    const date = normalizeDate(flightData.date);
    const error = validateChatFlight({ from, to, date });
    if (error) {
      event?.preventDefault();
      botReply(error);
      setStep(!from ? "from" : !to || from === to ? "to" : "date");
      return;
    }
    setOpen(false);
  };
  const resetChat = async () => { await live.reset(); };
  return {
    open,
    setOpen,
    input,
    setInput,
    step,
    flightData,
    isTyping,
    messages,
    live,
    sending,
    humanActive,
    botBusy,
    messagesEndRef,
    handleQuickOption,
    handleSend,
    handleKeyDown,
    goToFlightSearch,
    resetChat
  };
}
