import ChatFlightCard from "./ChatFlightCard.jsx";

export default function ChatMessages({
  messages,
  botBusy,
  step,
  flightData,
  sending,
  isTyping,
  humanActive,
  goToFlightSearch,
  handleSend,
  handleQuickOption,
  messagesEndRef
}) {
  return <div className="chatbot-body">
            <div className="chat-date">Hôm nay</div>

            {/* MESSAGES */}

            {messages.map(message => <div key={message.id} className={`message-row ${message.sender === "user" ? "user-row" : "bot-row"}`}>
                {message.sender === "bot" && <div className="message-avatar">
                    <i className="fa-solid fa-robot"></i>
                  </div>}

                <div className={`message ${message.sender === "user" ? "user-message" : "bot-message"}`}>
                  {message.sender === "admin" && <strong className="chat-sender-label">Nhân viên hỗ trợ</strong>}
                  {message.sender === "system" && <strong className="chat-sender-label">Thông báo</strong>}
                  {String(message.text).split("\n").map((line, index, arr) => <span key={index}>
                        {line}

                        {index < arr.length - 1 && <br />}
                      </span>)}
                </div>
              </div>)}

            {/* TYPING */}

            {botBusy && <div className="message-row bot-row typing-row">
                <div className="message-avatar">
                  <i className="fa-solid fa-robot"></i>
                </div>

                <div className="message bot-message typing-message">
                  <span className="typing-dot"></span>

                  <span className="typing-dot"></span>

                  <span className="typing-dot"></span>
                </div>
              </div>}

            {/* SEARCH BUTTON */}

            {step === "done" && !isTyping && !humanActive && <ChatFlightCard flightData={flightData} disabled={sending} onSearch={goToFlightSearch} onApply={handleSend} />}

            {/* QUICK OPTION */}

            {step === "idle" && !isTyping && !humanActive && <div className="quick-options">
                <button type="button" onClick={() => handleQuickOption("search")}>
                  ✈️ Tìm chuyến bay
                </button>

                <button type="button" onClick={() => handleQuickOption("destination")}>
                  🌴 Gợi ý điểm đến
                </button>

                <button type="button" onClick={() => handleQuickOption("date")}>
                  📅 Tôi chưa biết ngày đi
                </button>

                <button type="button" onClick={() => handleQuickOption("support")}>
                  ☎️ Cần hỗ trợ
                </button>
              </div>}

            <div ref={messagesEndRef}></div>
          </div>;
}
