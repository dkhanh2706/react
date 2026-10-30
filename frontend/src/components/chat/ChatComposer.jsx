export default function ChatComposer({
  input,
  live,
  botBusy,
  setInput,
  handleKeyDown,
  sending,
  handleSend
}) {
  return <div className="chatbot-input-area">
            <div className="input-wrapper">
              <input type="text" maxLength={4000} value={input} placeholder={live.connecting ? "Đang kết nối…" : botBusy ? "Trợ lý đang trả lời..." : "Nhập tin nhắn..."} onChange={event => setInput(event.target.value)} onKeyDown={handleKeyDown} disabled={botBusy || sending || live.connecting} />
            </div>

            <button type="button" className="send-button" onClick={handleSend} disabled={!input.trim() || botBusy || sending || live.connecting}>
              ➤
            </button>
          </div>;
}
