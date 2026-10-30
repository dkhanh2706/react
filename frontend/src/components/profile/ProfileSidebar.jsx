import { ProfileAvatar } from "./ProfileAvatar.jsx";
import { UserIcon, PlaneIcon, BookingIcon, LockIcon } from "./ProfileIcons.jsx";
export default function ProfileSidebar({
  avatarSource,
  avatarLetter,
  displayName,
  user,
  navigate,
  openPasswordModal
}) {
  return <aside className="account-sidebar">
            <div className="account-sidebar-user">
              <ProfileAvatar avatarSource={avatarSource} avatarLetter={avatarLetter} />

              <div className="account-user-text">
                <strong>{displayName}</strong>

                <span>{user.email}</span>
              </div>
            </div>

            <div className="account-menu">
              <button type="button" className="account-menu-item active">
                <span className="account-menu-icon">
                  <UserIcon />
                </span>

                <span>Thông tin cá nhân</span>
              </button>

              <button type="button" className="account-menu-item" onClick={() => navigate("/my-tickets")}>
                <span className="account-menu-icon">
                  <PlaneIcon />
                </span>

                <span>Vé máy bay của tôi</span>
              </button>

              <button type="button" className="account-menu-item" onClick={() => navigate("/my-orders")}>
                <span className="account-menu-icon">
                  <BookingIcon />
                </span>

                <span>Quản lý đặt chỗ</span>
              </button>

              <button type="button" className="account-menu-item" onClick={openPasswordModal}>
                <span className="account-menu-icon">
                  <LockIcon />
                </span>

                <span>Bảo mật tài khoản</span>
              </button>
            </div>
          </aside>;
}
