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
    flightData,
    isTyping,
    messages,
    live,
    sending,
    humanActive,
    botBusy,
    messagesEndRef,
    handleQuickOption,
    handleSend,
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

          <ChatHeader humanActive={humanActive} resetChat={resetChat} connecting={live.connecting} setOpen={setOpen} />

          {live.session && live.session.status !== "waiting" && <div className="chat-staff-status" role="status">
            {humanActive ? live.session.disconnected_at ? `Nhân viên mất kết nối. Bot sẽ hỗ trợ sau tối đa ${live.session.reconnectGraceMs / 1000} giây.` : "Nhân viên đang hỗ trợ bạn" : <>
                <span>Bot đang hỗ trợ · Nhân viên có thể tiếp nhận hội thoại</span>
              </>}
          </div>}
          {live.error && <div className="chat-connection-error" role="alert">{live.error}</div>}
          {/* BODY */}

          <ChatMessages messages={messages} botBusy={botBusy} step={step} flightData={flightData} sending={sending} isTyping={isTyping} humanActive={humanActive} goToFlightSearch={goToFlightSearch} handleSend={handleSend} handleQuickOption={handleQuickOption} messagesEndRef={messagesEndRef} />

          {/* INPUT */}

          <ChatComposer input={input} live={live} botBusy={botBusy} setInput={setInput} handleKeyDown={handleKeyDown} sending={sending} handleSend={handleSend} />

          {/* FOOTER */}

          <div className="chatbot-footer">Trợ lý AI hỗ trợ đặt vé ✦</div>
        </div>}
    </>;
}
export default Chatbot;
