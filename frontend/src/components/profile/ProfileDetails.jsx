import { formatDate } from "../../utils/format.js";
import { UserIcon, MailIcon, PhoneIcon, CalendarIcon } from "./ProfileIcons.jsx";
export default function ProfileDetails({
  loading,
  editing,
  form,
  handleChange,
  user,
  handleCancel,
  saving,
  handleSave
}) {
  return <div className="account-card">
              <div className="account-card-header">
                <div>
                  <h2>Thông tin cá nhân</h2>

                  <p>Thông tin được sử dụng khi đặt vé máy bay.</p>
                </div>
              </div>

              {loading ? <div className="profile-loading">Đang tải thông tin...</div> : <div className="account-info-grid">
                  <div className="account-info-item">
                    <div className="account-info-icon">
                      <UserIcon />
                    </div>

                    <div className="account-info-text">
                      <span>Họ và tên</span>

                      {editing ? <input className="profile-edit-input" name="full_name" value={form.full_name} onChange={handleChange} maxLength={100} /> : <strong>{user.full_name || "Chưa cập nhật"}</strong>}
                    </div>
                  </div>

                  <div className="account-info-item">
                    <div className="account-info-icon">
                      <MailIcon />
                    </div>

                    <div className="account-info-text">
                      <span>Email</span>

                      <strong>{user.email || "Chưa cập nhật"}</strong>

                      {editing && <small className="profile-email-note">
                          Email không thể chỉnh sửa
                        </small>}
                    </div>
                  </div>

                  <div className="account-info-item">
                    <div className="account-info-icon">
                      <PhoneIcon />
                    </div>

                    <div className="account-info-text">
                      <span>Số điện thoại</span>

                      {editing ? <input className="profile-edit-input" name="phone" value={form.phone} onChange={handleChange} maxLength={10} inputMode="numeric" /> : <strong>{user.phone || "Chưa cập nhật"}</strong>}
                    </div>
                  </div>

                  <div className="account-info-item">
                    <div className="account-info-icon">
                      <CalendarIcon />
                    </div>

                    <div className="account-info-text">
                      <span>Ngày sinh</span>

                      {editing ? <input type="date" className="profile-edit-input" name="birth_date" value={form.birth_date ? form.birth_date.substring(0, 10) : ""} onChange={handleChange} /> : <strong>{formatDate(user.birth_date, { fallback: "Chưa cập nhật" })}</strong>}
                    </div>
                  </div>

                  <div className="account-info-item">
                    <div className="account-info-icon">
                      <UserIcon />
                    </div>

                    <div className="account-info-text">
                      <span>Giới tính</span>

                      {editing ? <select className="profile-edit-input" name="gender" value={form.gender || ""} onChange={handleChange}>
                          <option value="">Chưa chọn</option>
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select> : <strong>{user.gender || "Chưa cập nhật"}</strong>}
                    </div>
                  </div>
                </div>}

              {editing && <div className="profile-edit-actions">
                  <button type="button" className="profile-cancel-button" onClick={handleCancel} disabled={saving}>
                    Hủy
                  </button>

                  <button type="button" className="profile-save-button" onClick={handleSave} disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>}
            </div>;
}
