import { useContext } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { AdminChatContext } from "../../contexts/AdminChatContext";
export default function AdminChatPresence() {
  const {
    state,
    connected,
    busy,
    error,
    toggle
  } = useContext(AdminChatContext);
  const available = state.available;
  return <div className="admin-chat-presence">
    <button type="button" className={available && connected ? 'is-online' : ''} onClick={toggle} disabled={busy || !connected} aria-pressed={available && connected}>
      {available && connected ? <Wifi size={18} /> : <WifiOff size={18} />}
      {connected ? available ? 'Sẵn sàng hỗ trợ' : 'Ngừng nhận khách mới' : 'Chat chưa kết nối'}
    </button>
    <small>Tắt trạng thái vẫn tiếp tục các cuộc đã nhận.</small>
    {error && <small role="alert">{error}</small>}
  </div>;
}
