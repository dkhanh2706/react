import { getAuth } from "../utils/auth.js";
import api from "./axios";

export function connectChat(credentials, { onChange, onConnection, onError, onSessionEnd }) {
  const base = new URL(api.defaults.baseURL.replace(/\/$/, '') + '/chat/live', window.location.origin);
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = import.meta.env.VITE_CHAT_WS_URL || base.href;
  let socket, timer, stopped = false, retries = 0;
  const open = () => {
    if (stopped) return;
    socket = new WebSocket(url);
    socket.onopen = () => socket.send(JSON.stringify({ type: 'auth', ...credentials }));
    socket.onmessage = event => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === 'ready') { retries = 0; onConnection?.(true); onChange(); }
      else if (data.type === 'changed') onChange();
      else if (data.type === 'deleted' && data.id === credentials.id) {
        stopped = true;
        onConnection?.(false);
        onSessionEnd?.('deleted');
        socket.close();
      }
    };
    socket.onerror = () => onError?.('Kết nối chat bị gián đoạn. Đang kết nối lại…');
    socket.onclose = event => {
      if (stopped) return;
      onConnection?.(false);
      if (event.code === 4002) { stopped = true; onSessionEnd?.('deleted'); return; }
      if (event.code === 4001 || event.code === 4401) {
        stopped = true;
        onSessionEnd?.();
        if (credentials.token) onError?.('Phiên kết nối chat đã kết thúc. Vui lòng đăng nhập lại.');
        return;
      }
      timer = setTimeout(open, Math.min(1000 * 2 ** retries++, 10000));
    };
  };
  const online = () => {
    if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
    clearTimeout(timer); open();
  };
  window.addEventListener('online', online);
  open();
  return () => {
    stopped = true;
    clearTimeout(timer);
    window.removeEventListener('online', online);
    if (socket) {
      socket.onclose = null;
      if (socket.readyState === WebSocket.CONNECTING) socket.onopen = () => socket.close();
      else socket.close();
    }
  };
}

export async function stopAdminChat() {
  const { user, token } = getAuth();
  if (user?.role !== 'ADMIN' || !token) return;
  try { await api.post('/chat/admin/logout', {}, { timeout: 3000 }); }
  catch { /* Offline logout closes the socket; backend applies the 60s grace. */ }
}
