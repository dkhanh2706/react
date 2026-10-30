import { MailIcon } from "./ProfileIcons.jsx";
export default function ChangePasswordModal({
  closePasswordModal,
  user,
  passwordError,
  codeRequested,
  requestPasswordCode,
  requestingCode,
  passwordForm,
  handlePasswordInput,
  changingPassword,
  changePassword
}) {
  return <div className="password-modal-overlay" onMouseDown={event => {
    if (event.target === event.currentTarget) {
      closePasswordModal();
    }
  }}>
          <div className="password-modal">
            <button type="button" className="password-modal-close" onClick={closePasswordModal}>
              ×
            </button>

            <div className="password-modal-icon">🔐</div>

            <h2>Đổi mật khẩu</h2>

            <p className="password-modal-description">
              Mã xác nhận sẽ được gửi tới email:
            </p>

            <div className="password-email-box">
              <MailIcon />

              <strong>{user.email}</strong>
            </div>

            {passwordError && <div className="password-error-box" role="alert">
                <span className="password-error-icon">⚠</span>

                <p>{passwordError}</p>
              </div>}

            {!codeRequested ? <button type="button" className="password-send-code-button" onClick={requestPasswordCode} disabled={requestingCode}>
                {requestingCode ? "Đang gửi mã..." : "Gửi mã xác nhận"}
              </button> : <>
                <div className="password-form-field">
                  <label>Mã xác nhận</label>

                  <input type="text" name="code" maxLength={6} inputMode="numeric" placeholder="Nhập mã 6 số" value={passwordForm.code} onChange={handlePasswordInput} />
                </div>

                <div className="password-form-field">
                  <label>Mật khẩu mới</label>

                  <input type="password" name="newPassword" placeholder="Ít nhất 8 ký tự" value={passwordForm.newPassword} onChange={handlePasswordInput} />
                </div>

                <div className="password-form-field">
                  <label>Xác nhận mật khẩu mới</label>

                  <input type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu mới" value={passwordForm.confirmPassword} onChange={handlePasswordInput} />
                </div>

                <button type="button" className="password-confirm-button" disabled={changingPassword} onClick={changePassword}>
                  {changingPassword ? "Đang đổi mật khẩu..." : "Xác nhận đổi mật khẩu"}
                </button>

                <button type="button" className="password-resend-button" disabled={requestingCode} onClick={requestPasswordCode}>
                  {requestingCode ? "Đang gửi..." : "Gửi lại mã"}
                </button>
              </>}
          </div>
        </div>;
}
