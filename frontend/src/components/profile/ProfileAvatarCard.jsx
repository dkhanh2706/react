import { ProfileAvatar } from "./ProfileAvatar.jsx";
export default function ProfileAvatarCard({
  avatarSource,
  avatarLetter,
  uploadingAvatar,
  fileInputRef,
  handleAvatarSelect,
  displayName,
  user
}) {
  return <div className="account-profile-card">
              <div className="account-profile-top">
                <div className="profile-avatar-area">
                  <ProfileAvatar avatarSource={avatarSource} avatarLetter={avatarLetter} large />

                  <button type="button" className="profile-avatar-change-button" disabled={uploadingAvatar} onClick={() => fileInputRef.current?.click()}>
                    {uploadingAvatar ? "Đang tải..." : "📷 Đổi ảnh"}
                  </button>

                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleAvatarSelect} />
                </div>

                <div className="account-profile-name">
                  <h2>{displayName}</h2>

                  <p>{user.email}</p>

                  <span className="account-status">
                    Tài khoản đang hoạt động
                  </span>

                  <small className="profile-avatar-hint">
                    JPG, PNG, WEBP · tối đa 2MB
                  </small>
                </div>
              </div>
            </div>;
}
