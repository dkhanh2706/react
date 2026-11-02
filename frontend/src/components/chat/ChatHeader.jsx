export default function ChatHeader({
  humanActive,
  resetChat,
  connecting,
  setOpen
}) {
  return <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar-wrap">
                <div className="chatbot-avatar">
                  <i className="fa-solid fa-robot"></i>
                </div>

                <span className="avatar-status"></span>
              </div>

              <div>
                <h4>Trợ lý đặt vé</h4>

                <p>{humanActive ? "Đang chat với nhân viên" : "AI hỗ trợ trực tuyến"}</p>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button type="button" className="reset-button" disabled={connecting} onClick={resetChat} title="Làm mới cuộc trò chuyện" aria-label="Làm mới cuộc trò chuyện">
                ↻
              </button>

              <button type="button" className="chatbot-close" aria-label="Đóng chat" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>
          </div>;
}
