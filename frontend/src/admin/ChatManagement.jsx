import { formatTime } from "../utils/format.js";
import { useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageCircle, Send } from 'lucide-react';
import api from "../api/axios";
import { chatRequestId } from "../utils/chat";
import AdminLayout from "../layouts/AdminLayout";
import { AdminChatContext } from "../contexts/AdminChatContext";
import "../styles/admin/ChatManagement.css";

const labels = { waiting: 'Chờ tiếp nhận', active: 'Đang hỗ trợ', ended: 'Đã kết thúc' };

export default function ChatManagement() {
  const { state, revision, connected } = useContext(AdminChatContext);
  const [filter, setFilter] = useState('waiting');
  const [selected, setSelected] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);
  const pending = useRef(null);
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      const requestGeneration = generation.current;
      try {
        const detail = selected ? (await api.post(`/chat/admin/${selected}`, {})).data : null;
        if (active && requestGeneration === generation.current) { setConversation(detail); setError(''); }
      } catch (err) { if (active) setError(err.response?.data?.message || 'Mất kết nối. Đang thử lại…'); }
    };
    poll();
    return () => { active = false; };
  }, [selected, revision]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation?.messages?.length]);

  const act = async action => {
    if (!selected || busy) return;
    setBusy(true);
    generation.current++;
    try {
      if (action === 'send' && pending.current?.text !== input.trim()) pending.current = { text: input.trim(), requestId: chatRequestId() };
      const { data } = await api.post(`/chat/admin/${selected}`, { action, ...(action === 'send' ? pending.current : {}) });
      setConversation(data);
      if (action === 'send') { setInput(''); pending.current = null; }
      if (action === 'accept') setFilter('active');
      setError('');
    } catch (err) { toast.error(err.response?.data?.message || 'Không thực hiện được. Vui lòng thử lại.'); }
    finally { generation.current++; setBusy(false); }
  };

  const mine = conversation?.status === 'active' && conversation.admin_id === state.adminId;
  return <AdminLayout pageTitle="Chat hỗ trợ khách hàng">
    <div className="admin-chat-page">
      <header><MessageCircle /><div><h2>Hỗ trợ khách hàng</h2><p>Bật sẵn sàng ở thanh bên rồi chọn từng cuộc để tiếp nhận.</p></div></header>
      {error && <p className="admin-chat-error" role="alert">{error}</p>}
      <div className="admin-chat-grid">
        <aside className="admin-chat-list">
          <div className="admin-chat-tabs">{Object.entries(labels).map(([key, label]) => <button type="button" key={key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{label} ({state.conversations.filter(c => c.status === key).length})</button>)}</div>
          {state.conversations.filter(c => c.status === filter).map(c => <button type="button" key={c.id} className={`admin-chat-item ${selected === c.id ? 'selected' : ''}`} onClick={() => { generation.current++; setSelected(c.id); setConversation(null); setInput(''); pending.current = null; }}>
            <strong>Khách #{c.id.slice(0, 8)} {c.unread > 0 && <b>{c.unread}</b>}</strong>
            <span>{c.last_message}</span>
            <small>{labels[c.status]}{c.admin_id === state.adminId ? ' · Bạn phụ trách' : c.admin_id ? ' · Nhân viên khác' : ''}</small>
          </button>)}
          {!state.conversations.some(c => c.status === filter) && <p className="admin-chat-empty">Chưa có cuộc trò chuyện.</p>}
        </aside>
        <section className="admin-chat-detail">
          {!conversation ? <p className="admin-chat-empty">{selected ? 'Đang tải hội thoại…' : 'Chọn một cuộc trò chuyện để xem lịch sử.'}</p> : <>
            <div className="admin-chat-toolbar"><div><strong>Khách #{conversation.id.slice(0, 8)}</strong><p>{conversation.disconnected_at ? 'Đang chờ kết nối lại' : labels[conversation.status] || 'Bot đang hỗ trợ'}</p></div>
              {mine ? <button type="button" disabled={busy} onClick={() => act('end')}>Kết thúc hỗ trợ</button>
                : conversation.status !== 'active' && <button type="button" disabled={busy || !connected || !state.available} onClick={() => act('accept')}>Tiếp nhận</button>}
            </div>
            <div className="admin-chat-messages" role="log" aria-label="Lịch sử hội thoại">{conversation.messages.map(m => <div key={m.id} className={`admin-chat-message from-${m.sender}`}><small>{{ user: 'Khách hàng', bot: 'Trợ lý AI', admin: 'Nhân viên', system: 'Thông báo' }[m.sender]} · {formatTime(m.created_at)}</small><p>{m.text}</p></div>)}<div ref={endRef} /></div>
            <form className="admin-chat-compose" onSubmit={e => { e.preventDefault(); if (input.trim() && mine) act('send'); }}>
              <input aria-label="Tin nhắn hỗ trợ" maxLength={4000} value={input} onChange={e => setInput(e.target.value)} disabled={!mine || busy} placeholder={mine ? 'Nhập tin nhắn…' : 'Tiếp nhận cuộc chat để trả lời'} />
              <button type="submit" disabled={!mine || busy || !input.trim()}><Send size={18} /> Gửi</button>
            </form>
          </>}
        </section>
      </div>
    </div>
  </AdminLayout>;
}
