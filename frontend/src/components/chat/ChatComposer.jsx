import { useEffect, useRef } from "react";

export default function ChatComposer({
  input,
  live,
  botBusy,
  setInput,
  handleKeyDown,
  sending,
  handleSend
}) {
  const composerRef = useRef(null);
  const inputRef = useRef(null);
  const awaitingReply = useRef(false);
  const disabled = botBusy || sending || live.connecting || !live.session;

  useEffect(() => {
    if (botBusy || sending) { awaitingReply.current = true; return; }
    if (disabled || !awaitingReply.current) return;
    awaitingReply.current = false;
    const active = document.activeElement;
    // Disabling the composer drops focus to the page. Restore it only when the
    // customer has not moved to a different control while waiting for the reply.
    if (active === document.body || composerRef.current?.contains(active)) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [botBusy, sending, disabled]);

  return <div className="chatbot-input-area" ref={composerRef}>
            <div className="input-wrapper">
              <input ref={inputRef} aria-label="Tin nhắn của bạn" type="text" maxLength={4000} value={input} placeholder={live.connecting ? "Đang kết nối…" : botBusy ? "Trợ lý đang trả lời..." : "Nhập tin nhắn..."} onChange={event => setInput(event.target.value)} onKeyDown={handleKeyDown} disabled={disabled} />
            </div>

            <button type="button" aria-label="Gửi tin nhắn" className="send-button" onClick={handleSend} disabled={!input.trim() || botBusy || sending || live.connecting || !live.session}>
              ➤
            </button>
          </div>;
}
