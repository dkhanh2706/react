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
    <button type="button" className={available && connected ? 'is-online' : ''} onClick={toggle} disabled={busy || !connected} aria-pressed={available && connected} aria-label={connected ? available ? 'Đang trực hỗ trợ' : 'Tạm ngừng trực' : 'Chat chưa kết nối'} title={connected ? available ? 'Đang trực hỗ trợ' : 'Tạm ngừng trực' : 'Chat chưa kết nối'}>
      {available && connected ? <Wifi size={18} /> : <WifiOff size={18} />}
      <span>{connected ? available ? 'Đang trực hỗ trợ' : 'Tạm ngừng trực' : 'Chat chưa kết nối'}</span>
    </button>
    <small>Hội thoại tự vào hộp thư. Bấm Tiếp nhận để hỗ trợ.</small>
    {error && <small role="alert">{error}</small>}
  </div>;
}
