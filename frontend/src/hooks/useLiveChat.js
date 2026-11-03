import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { connectChat } from "../api/chatRealtime";
import { getAuthOwner } from "../utils/auth.js";

const storageKey = "flight-support-session";
const storedCredentials = () => {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey));
    return typeof value?.id === "string" && typeof value?.secret === "string" && (value.owner || "guest") === getAuthOwner() ? value : null;
  } catch { return null; }
};

export default function useLiveChat(open, setMessages, clearLocalChat) {
  const [session, setSession] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [restart, setRestart] = useState(0);
  const current = useRef(null);
  const credentials = useRef(null);
  const epoch = useRef(0);
  const resetting = useRef(false);
  const latestTimestamp = useRef(0);

  const apply = useCallback((data, requestEpoch = epoch.current) => {
    if (requestEpoch !== epoch.current || !data?.id || data.id !== credentials.current?.id) return false;
    const timestamp = +new Date(data.updated_at);
    if (timestamp < latestTimestamp.current) return false;
    if (current.current && (data.version < current.current.version || BigInt(data.messages.at(-1)?.id || 0) < BigInt(current.current.messages.at(-1)?.id || 0))) return false;
    latestTimestamp.current = timestamp;
    const previous = current.current;
    if (data.status === "active" && previous?.status !== "active") clearLocalChat();
    current.current = data;
    setSession(data);
    if (!previous || previous.id !== data.id || previous.messages.at(-1)?.id !== data.messages.at(-1)?.id) setMessages(data.messages);
    return true;
  }, [setMessages, clearLocalChat]);

  const forget = useCallback(id => {
    if (resetting.current || (id && credentials.current?.id !== id)) return;
    epoch.current++;
    if (storedCredentials()?.id === credentials.current?.id) localStorage.removeItem(storageKey);
    credentials.current = null;
    current.current = null;
    latestTimestamp.current = 0;
    clearLocalChat();
    setMessages([]);
    setSession(null);
    setError("");
    setRestart(value => value + 1);
  }, [setMessages, clearLocalChat]);

  useEffect(() => {
    const onStorage = event => {
      if (event.key === storageKey && current.current && storedCredentials()?.id !== credentials.current?.id) forget(credentials.current?.id);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [forget]);

  useEffect(() => {
    if (!open) return;
    let active = true, loading = false;
    const initialize = async () => {
      if (current.current || loading || resetting.current) return;
      loading = true;
      setConnecting(true);
      const requestEpoch = epoch.current;
      try {
        credentials.current ||= storedCredentials();
        let data;
        if (credentials.current) {
          try { data = (await api.post("/chat/sync", credentials.current)).data; }
          catch (err) {
            if (err.response?.status !== 403) throw err;
            if (!active || requestEpoch !== epoch.current) return;
            clearLocalChat();
            credentials.current = null;
            localStorage.removeItem(storageKey);
          }
        }
        if (!active || requestEpoch !== epoch.current) return;
        if (!credentials.current) {
          data = (await api.post("/chat/session")).data;
          if (!active || requestEpoch !== epoch.current) return;
          credentials.current = { id: data.id, secret: data.secret, owner: getAuthOwner() };
          localStorage.setItem(storageKey, JSON.stringify(credentials.current));
        }
        if (active && apply(data, requestEpoch)) setError("");
      } catch (err) {
        if (active && requestEpoch === epoch.current) setError(err.response?.data?.message || "Không kết nối được chat. Đang thử lại…");
      } finally { loading = false; if (active && requestEpoch === epoch.current) setConnecting(false); }
    };
    initialize();
    const timer = setInterval(initialize, 2500);
    return () => { active = false; clearInterval(timer); };
  }, [open, restart, apply, clearLocalChat]);

  const sessionId = session?.id;
  useEffect(() => {
    if (!open || !sessionId) return;
    let active = true, loading = false, pending = false;
    const identity = { ...credentials.current };
    const requestEpoch = epoch.current;
    const refresh = async () => {
      pending = true;
      if (loading || resetting.current) return;
      loading = true;
      try {
        while (active && pending && requestEpoch === epoch.current) {
          pending = false;
          const { data } = await api.post("/chat/sync", identity);
          if (active && apply(data, requestEpoch)) setError("");
        }
      } catch (err) {
        if (!active || requestEpoch !== epoch.current) return;
        if (err.response?.status === 403) forget(identity.id);
        else setError(err.response?.data?.message || "Không tải được tin nhắn.");
      } finally { loading = false; }
    };
    const stop = connectChat(identity, {
      onChange: refresh,
      onError: message => { if (active && requestEpoch === epoch.current) setError(message); },
      onSessionEnd: () => { if (active) forget(identity.id); },
    });
    return () => { active = false; stop(); };
  }, [open, sessionId, apply, forget, restart]);

  const action = async (path, body = {}, expectedSessionId) => {
    if (resetting.current || !credentials.current) throw new Error("Đang kết nối chat. Vui lòng thử lại.");
    if (expectedSessionId && credentials.current.id !== expectedSessionId) return null;
    const identity = { ...credentials.current }, requestEpoch = epoch.current;
    try {
      const { data } = await api.post(`/chat/${path}`, { ...identity, ...body });
      if (requestEpoch !== epoch.current || credentials.current?.id !== identity.id) return null;
      apply(data, requestEpoch);
      setError("");
      return data;
    } catch (err) {
      if (requestEpoch !== epoch.current) return null;
      if (err.response?.status === 403) forget(identity.id);
      throw err;
    }
  };

  const reset = async () => {
    if (!credentials.current || resetting.current) return false;
    resetting.current = true;
    setConnecting(true);
    const identity = { ...credentials.current };
    const requestEpoch = ++epoch.current;
    clearLocalChat();
    try {
      const { data } = await api.post("/chat/reset", identity);
      current.current = null;
      latestTimestamp.current = 0;
      credentials.current = { id: data.id, secret: data.secret, owner: getAuthOwner() };
      localStorage.setItem(storageKey, JSON.stringify(credentials.current));
      apply(data, requestEpoch);
      setError("");
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Chưa làm mới được cuộc trò chuyện. Vui lòng thử lại.");
      return false;
    } finally { resetting.current = false; setConnecting(false); setRestart(value => value + 1); }
  };

  return { session, connecting, error, setError, current, action, reset };
}
