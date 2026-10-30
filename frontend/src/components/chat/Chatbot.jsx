import useChatbot from "../../hooks/useChatbot.js";
import ChatComposer from "./ChatComposer.jsx";
import ChatMessages from "./ChatMessages.jsx";
import ChatHeader from "./ChatHeader.jsx";
import "../../styles/Chatbot.css";
function Chatbot() {
  const {
    open,
    setOpen,
    input,
    setInput,
    step,
    isTyping,
    messages,
    live,
    sending,
    humanActive,
    botBusy,
    messagesEndRef,
    handleQuickOption,
    handleSend,
    requestStaff,
    handleKeyDown,
    goToFlightSearch,
    resetChat
  } = useChatbot();
  return <>
      {/* FLOAT BUTTON */}

      <div className="support">
        <button type="button" className={`support-button ${open ? "active" : ""}`} onClick={() => setOpen(prev => !prev)}>
          <span className="support-icon">{open ? "✕" : "💬"}</span>

          {!open && <span>Chat</span>}
        </button>
      </div>

      {/* CHATBOX */}

      {open && <div className="chatbot-box">
          {/* HEADER */}

          <ChatHeader humanActive={humanActive} resetChat={resetChat} setOpen={setOpen} />

          {live.session && <div className="chat-staff-status" role="status">
            {humanActive ? live.session.disconnected_at ? `Nhân viên mất kết nối. Bot sẽ hỗ trợ sau tối đa ${live.session.reconnectGraceMs / 1000} giây.` : "Nhân viên đang hỗ trợ bạn" : <>
                <span>{live.session.status === "waiting" ? "Đang chờ tiếp nhận · Bot vẫn hỗ trợ" : live.session.available ? "Nhân viên sẵn sàng hỗ trợ" : "Nhân viên ngoại tuyến · Bot vẫn hỗ trợ"}</span>
                <button type="button" onClick={requestStaff} disabled={!live.session.available && live.session.status !== "waiting"}>
                  {live.session.status === "waiting" ? "Hủy yêu cầu" : "Chat với nhân viên"}
                </button>
              </>}
          </div>}
          {live.error && <div className="chat-connection-error" role="alert">{live.error}</div>}
          {/* BODY */}

          <ChatMessages messages={messages} botBusy={botBusy} step={step} isTyping={isTyping} humanActive={humanActive} goToFlightSearch={goToFlightSearch} handleQuickOption={handleQuickOption} messagesEndRef={messagesEndRef} />

          {/* INPUT */}

          <ChatComposer input={input} live={live} botBusy={botBusy} setInput={setInput} handleKeyDown={handleKeyDown} sending={sending} handleSend={handleSend} />

          {/* FOOTER */}

          <div className="chatbot-footer">Trợ lý AI hỗ trợ đặt vé ✦</div>
        </div>}
    </>;
}
export default Chatbot;
