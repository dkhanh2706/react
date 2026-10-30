import { getAuth, isAdminUser, clearAuthStorage } from "../utils/auth.js";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from "../api/axios";
import { connectChat } from "../api/chatRealtime";
import { AdminChatContext } from "./AdminChatContext";

function adminToken() {
  const { token, user } = getAuth();
  return isAdminUser(user) ? token : null;
}
const empty = { available: false, conversations: [] };

export default function AdminChatProvider({ children }) {
  const [token, setToken] = useState(adminToken);
  const [state, setState] = useState(empty);
  const [connection, setConnection] = useState({ token: null, connected: false });
  const connected = connection.token === token && connection.connected;
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const refreshRef = useRef(null);

  useEffect(() => {
    const syncAuth = () => setToken(adminToken());
    window.addEventListener('storage', syncAuth);
    window.addEventListener('auth-changed', syncAuth);
    return () => { window.removeEventListener('storage', syncAuth); window.removeEventListener('auth-changed', syncAuth); };
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true, loading = false, pending = false;
    const refresh = async () => {
      pending = true;
      if (loading) return;
      loading = true;
      try {
        while (active && pending) {
          pending = false;
          const { data } = await api.post('/chat/admin/state', { readOnly: true });
          if (active) { setState({ ...data, sessionToken: token }); setRevision(value => value + 1); setError(''); }
        }
      } catch (err) { if (active) setError(err.response?.data?.message || 'Không tải được trạng thái chat.'); }
      finally { loading = false; }
    };
    refreshRef.current = refresh;
    const disconnect = connectChat({ token }, {
      onChange: refresh,
      onConnection: value => { if (active) setConnection({ token, connected: value }); },
      onError: message => { if (active) setError(message); },
      onSessionEnd: () => {
        if (!active || localStorage.getItem('token') !== token) return;
        clearAuthStorage();
        window.location.assign('/login');
      },
    });
    return () => { active = false; disconnect(); refreshRef.current = null; };
  }, [token]);

  const toggle = useCallback(async () => {
    if (!connected || busy) return;
    setBusy(true);
    try {
      await api.post('/chat/admin/state', { available: !state.available });
      await refreshRef.current?.();
    } catch (err) { setError(err.response?.data?.message || 'Không đổi được trạng thái.'); }
    finally { setBusy(false); }
  }, [connected, busy, state.available]);
  const value = useMemo(() => ({ state: token && state.sessionToken === token ? state : empty, connected: !!token && connected, busy, error: token ? error : '', revision, toggle }), [state, token, connected, busy, error, revision, toggle]);
  return <AdminChatContext.Provider value={value}>{children}</AdminChatContext.Provider>;
}
