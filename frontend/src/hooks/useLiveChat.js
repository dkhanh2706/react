import { useCallback, useEffect, useRef, useState } from 'react';
import api from "../api/axios";
import { connectChat } from "../api/chatRealtime";
const storageKey = 'flight-support-session';
export default function useLiveChat(open, setMessages) {
  const [session, setSession] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const current = useRef(null);
  const credentials = useRef(null);
  const latestTimestamp = useRef(0);
  const syncing = useRef(false);
  const apply = useCallback(data => {
    const timestamp = +new Date(data.updated_at);
    if (timestamp < latestTimestamp.current) return;
    if (current.current && (data.version < current.current.version || BigInt(data.messages.at(-1)?.id || 0) < BigInt(current.current.messages.at(-1)?.id || 0))) return;
    latestTimestamp.current = timestamp;
    const previous = current.current;
    current.current = data;
    setSession(data);
    if (!previous || previous.messages.at(-1)?.id !== data.messages.at(-1)?.id) setMessages(data.messages);
  }, [setMessages]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    const sync = async () => {
      if (current.current) return; // Initialize once; WebSocket drives subsequent updates.
      if (syncing.current) return;
      syncing.current = true;
      try {
        if (!credentials.current) {
          setConnecting(true);
          try {
            credentials.current = JSON.parse(localStorage.getItem(storageKey));
          } catch {/* Start a fresh session. */}
        }
        let data;
        if (credentials.current) {
          try {
            data = (await api.post('/chat/sync', credentials.current)).data;
          } catch (err) {
            if (err.response?.status !== 403) throw err;
            credentials.current = null;
            localStorage.removeItem(storageKey);
          }
        }
        if (!credentials.current) {
          data = (await api.post('/chat/session')).data;
          credentials.current = {
            id: data.id,
            secret: data.secret
          };
          localStorage.setItem(storageKey, JSON.stringify(credentials.current));
        }
        if (active) {
          apply(data);
          setError('');
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Mất kết nối chat. Đang thử kết nối lại…');
      } finally {
        syncing.current = false;
        if (active) setConnecting(false);
      }
    };
    sync();
    const timer = setInterval(sync, 2500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [open, apply]);
  const sessionId = session?.id;
  useEffect(() => {
    if (!open || !sessionId) return;
    let active = true,
      loading = false,
      pending = false;
    const refresh = async () => {
      pending = true;
      if (loading) return;
      loading = true;
      try {
        while (active && pending) {
          pending = false;
          const {
            data
          } = await api.post('/chat/sync', credentials.current);
          if (active) {
            apply(data);
            setError('');
          }
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Không tải được tin nhắn.');
      } finally {
        loading = false;
      }
    };
    const stop = connectChat(credentials.current, {
      onChange: refresh,
      onError: message => {
        if (active) setError(message);
      },
      onSessionEnd: () => {
        if (!active) return;
        credentials.current = null;
        current.current = null;
        localStorage.removeItem(storageKey);
        setSession(null);
      }
    });
    return () => {
      active = false;
      stop();
    };
  }, [open, sessionId, apply]);
  const action = async (path, body = {}) => {
    if (!credentials.current) throw new Error('Đang kết nối chat. Vui lòng thử lại.');
    const {
      data
    } = await api.post(`/chat/${path}`, {
      ...credentials.current,
      ...body
    });
    apply(data);
    setError('');
    return data;
  };
  return {
    session,
    connecting,
    error,
    setError,
    current,
    action
  };
}
