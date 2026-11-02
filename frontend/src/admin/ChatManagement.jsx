import { formatTime, formatDateTime } from "../utils/format.js";
import { useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MessageCircle, Send, Search, UserRound, Bot, Headset, Clock3, Mail, Wifi, WifiOff, CheckCheck, Trash2 } from "lucide-react";
import api from "../api/axios";
import { chatRequestId } from "../utils/chat";
import AdminLayout from "../layouts/AdminLayout";
import { AdminChatContext } from "../contexts/AdminChatContext";
import "../styles/admin/ChatManagement.css";

const labels = { waiting: "Chờ tiếp nhận", active: "Đang hỗ trợ", ended: "Đã kết thúc", bot: "Bot hỗ trợ" };
const shortLabels = { waiting: "Chờ", active: "Đang hỗ trợ", ended: "Kết thúc" };
const senderNames = { user: "Khách hàng", bot: "Trợ lý AI", admin: "Nhân viên", system: "Thông báo" };

export default function ChatManagement() {
  const { state, revision, connected, refresh, error: connectionError } = useContext(AdminChatContext);
  const [filter, setFilter] = useState("waiting");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const messageList = useRef(null);
  const pending = useRef(null);
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const poll = async () => {
      const requestGeneration = generation.current;
      try {
        const detail = selected ? (await api.post(`/chat/admin/${selected}`, {}, { signal: controller.signal })).data : null;
        if (active && requestGeneration === generation.current) { setConversation(detail); setError(""); }
      } catch (err) {
        if (!active || requestGeneration !== generation.current) return;
        if (err.response?.status === 404) { setSelected(null); setConversation(null); setInput(""); pending.current = null; }
        else setError(err.response?.data?.message || "Mất kết nối. Đang thử lại…");
      }
    };
    poll();
    return () => { active = false; controller.abort(); };
  }, [selected, revision]);

  useEffect(() => {
    const element = messageList.current;
    if (element) element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [conversation?.id, conversation?.messages?.length]);

  const act = async action => {
    if (!selected || busy) return;
    setBusy(true);
    const requestGeneration = ++generation.current;
    try {
      if (action === "send" && pending.current?.text !== input.trim()) pending.current = { text: input.trim(), requestId: chatRequestId() };
      const { data } = await api.post(`/chat/admin/${selected}`, { action, ...(action === "send" ? pending.current : {}) });
      if (requestGeneration !== generation.current) return;
      if (action === "delete") {
        setSelected(null); setConversation(null); setInput(""); pending.current = null;
        await refresh();
        toast.success("Đã xóa vĩnh viễn cuộc trò chuyện");
        return;
      }
      setConversation(data);
      if (action === "send") { setInput(""); pending.current = null; }
      if (action === "accept") setFilter("active");
      setError("");
    } catch (err) { toast.error(err.response?.data?.message || "Không thực hiện được. Vui lòng thử lại."); }
    finally { if (generation.current === requestGeneration) generation.current++; setBusy(false); }
  };

  const mine = conversation?.status === "active" && conversation.admin_id === state.adminId;
  const counts = Object.fromEntries(Object.keys(labels).map(key => [key, state.conversations.filter(c => c.status === key).length]));
  const unread = state.conversations.reduce((sum, c) => sum + c.unread, 0);
  const conversations = state.conversations.filter(c => (filter === "all" || c.status === filter) && `${c.id} ${c.last_message || ""}`.toLowerCase().includes(query.trim().toLowerCase()));

  return <AdminLayout pageTitle="Chat hỗ trợ khách hàng">
    <div className="admin-chat-page">
      <header className="admin-chat-heading"><div><span className="admin-chat-eyebrow">TRUNG TÂM HỖ TRỢ</span><h1>Trò chuyện với khách hàng</h1><p>Hội thoại tự xuất hiện khi khách gửi tin. Tiếp nhận để dừng bot và trực tiếp hỗ trợ.</p></div><span className={`admin-chat-connection ${connected ? "" : "is-offline"}`}>{connected ? <Wifi size={14} /> : <WifiOff size={14} />}{connected ? "Đã kết nối trực tiếp" : "Đang kết nối lại"}</span></header>
      <div className="admin-chat-stats">
        <div className="admin-chat-stat"><Clock3 /><div><span>Chờ tiếp nhận</span><strong>{counts.waiting}</strong></div></div>
        <div className="admin-chat-stat"><Headset /><div><span>Đang hỗ trợ</span><strong>{counts.active}</strong></div></div>
        <div className="admin-chat-stat"><Mail /><div><span>Tin nhắn chưa đọc</span><strong>{unread}</strong></div></div>
      </div>
      {(error || connectionError) && <p className="admin-chat-error" role="alert">{error || connectionError}</p>}
      <div className="admin-chat-grid">
        <aside className="admin-chat-list" aria-label="Danh sách hội thoại">
          <div className="admin-chat-list-header"><h2>Hộp thư khách hàng</h2><label className="admin-chat-search"><Search size={16} /><input type="search" aria-label="Tìm hội thoại" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm mã khách hoặc nội dung..." /></label></div>
          <div className="admin-chat-tabs">{[["waiting", "Chờ"], ["active", "Đang hỗ trợ"], ["ended", "Kết thúc"], ["all", "Tất cả"]].map(([key, label]) => <button type="button" key={key} className={filter === key ? "selected" : ""} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label} {key === "all" ? state.conversations.length : counts[key]}</button>)}</div>
          <div className="admin-chat-items">{conversations.map(c => <button type="button" key={c.id} className={`admin-chat-item ${selected === c.id ? "selected" : ""}`} aria-pressed={selected === c.id} onClick={() => { generation.current++; setSelected(c.id); setConversation(null); setInput(""); setError(""); pending.current = null; }}>
            <span className="admin-chat-avatar"><UserRound size={18} /></span><span className="admin-chat-item-content"><span className="admin-chat-item-top"><strong>Khách #{c.id.slice(0, 8)}</strong><time title={formatDateTime(c.updated_at)}>{formatTime(c.updated_at)}</time></span><span className="admin-chat-preview">{c.last_message || "Chưa có tin nhắn"}</span><span className="admin-chat-item-bottom"><span className={`admin-chat-badge is-${c.status}`}>{shortLabels[c.status] || labels[c.status]}</span>{c.unread > 0 ? <b className="admin-chat-unread">{c.unread}</b> : <small>{c.admin_id === state.adminId ? "Bạn phụ trách" : c.admin_id ? "Nhân viên khác" : "Bot đang hỗ trợ"}</small>}</span></span>
          </button>)}{!conversations.length && <p className="admin-chat-empty">{query ? "Không tìm thấy hội thoại phù hợp." : "Chưa có hội thoại trong mục này."}</p>}</div>
        </aside>
        <section className="admin-chat-detail" aria-label="Chi tiết hội thoại">
          {!conversation ? <div className="admin-chat-welcome"><MessageCircle /><h2>{selected ? "Đang tải hội thoại…" : "Sẵn sàng lắng nghe khách hàng"}</h2><p>Chọn hội thoại trong hộp thư để xem tin nhắn và tiếp nhận hỗ trợ.</p></div> : <>
            <div className="admin-chat-toolbar"><div className="admin-chat-contact"><span className="admin-chat-avatar"><UserRound size={19} /></span><div><strong>Khách #{conversation.id.slice(0, 8)}</strong><p>{conversation.disconnected_at ? "Đang chờ kết nối lại" : labels[conversation.status]}{mine ? " · Bạn phụ trách" : conversation.admin_id ? " · Nhân viên khác phụ trách" : ""}</p></div></div>
              <div className="admin-chat-toolbar-actions">{mine ? <button type="button" disabled={busy} onClick={() => act("end")}><CheckCheck size={15} />Kết thúc hỗ trợ</button> : conversation.status !== "active" && <button type="button" className="admin-chat-accept" disabled={busy || !connected} onClick={() => act("accept")}><Headset size={15} />Tiếp nhận</button>}<button type="button" className="admin-chat-delete" disabled={busy} onClick={() => act("delete")} title="Xóa vĩnh viễn hội thoại đang chọn và toàn bộ tin nhắn"><Trash2 size={15} />Xóa</button></div>
            </div>
            <div className="admin-chat-messages" ref={messageList} role="log" aria-label="Lịch sử hội thoại">{conversation.messages.map(m => <div key={m.id} className={`admin-chat-message from-${m.sender}`}><small>{m.sender === "bot" && <Bot size={12} />}{senderNames[m.sender]} · {formatTime(m.created_at)}</small><p>{m.text}</p></div>)}</div>
            <form className="admin-chat-compose" onSubmit={event => { event.preventDefault(); if (input.trim() && mine) act("send"); }}><div>
              <input aria-label="Tin nhắn hỗ trợ" maxLength={4000} value={input} onChange={event => setInput(event.target.value)} disabled={!mine || busy} placeholder={mine ? "Nhập tin nhắn hỗ trợ khách hàng..." : conversation.status === "active" ? "Nhân viên khác đang hỗ trợ hội thoại này" : "Tiếp nhận hội thoại để trả lời khách"} />
              <button type="submit" disabled={!mine || busy || !input.trim()} aria-label="Gửi tin nhắn"><Send size={17} /><span>Gửi</span></button></div><p>{mine ? "Bạn đang trực tiếp hỗ trợ khách hàng." : "Xem hội thoại trước khi tiếp nhận hỗ trợ."}</p>
            </form>
          </>}
        </section>
      </div>
    </div>
  </AdminLayout>;
}
