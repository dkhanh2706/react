import useProfile from "../hooks/useProfile.js";
import ChangePasswordModal from "../components/profile/ChangePasswordModal.jsx";
import ProfileDetails from "../components/profile/ProfileDetails.jsx";
import ProfileAvatarCard from "../components/profile/ProfileAvatarCard.jsx";
import ProfileSidebar from "../components/profile/ProfileSidebar.jsx";
import { LockIcon, EditIcon } from "../components/profile/ProfileIcons.jsx";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";
import "../styles/Profile.css";
function Profile() {
  const {
    navigate,
    user,
    form,
    editing,
    loading,
    saving,
    fileInputRef,
    uploadingAvatar,
    handleAvatarSelect,
    passwordOpen,
    codeRequested,
    requestingCode,
    changingPassword,
    passwordError,
    passwordForm,
    openPasswordModal,
    closePasswordModal,
    requestPasswordCode,
    handlePasswordInput,
    changePassword,
    handleChange,
    handleEdit,
    handleCancel,
    handleSave,
    displayName,
    avatarLetter,
    avatarSource} = useProfile();
  return <div className="profile-page-wrapper">
      <Header />

      <main className="profile-page">
        <div className="profile-page-container">
          <ProfileSidebar avatarSource={avatarSource} avatarLetter={avatarLetter} displayName={displayName} user={user} navigate={navigate} openPasswordModal={openPasswordModal} />

          <section className="account-content">
            <div className="account-page-heading">
              <div>
                <h1>Hồ sơ cá nhân</h1>

                <p>Quản lý thông tin cá nhân và thông tin tài khoản của bạn.</p>
              </div>

              {!editing && <button type="button" className="account-edit-button" onClick={handleEdit}>
                  <EditIcon />

                  <span>Chỉnh sửa thông tin</span>
                </button>}
            </div>

            <ProfileAvatarCard avatarSource={avatarSource} avatarLetter={avatarLetter} uploadingAvatar={uploadingAvatar} fileInputRef={fileInputRef} handleAvatarSelect={handleAvatarSelect} displayName={displayName} user={user} />

            <ProfileDetails loading={loading} editing={editing} form={form} handleChange={handleChange} user={user} handleCancel={handleCancel} saving={saving} handleSave={handleSave} />

            <div className="account-card">
              <div className="account-card-header">
                <div>
                  <h2>Bảo mật tài khoản</h2>

                  <p>
                    Thay đổi mật khẩu bằng mã xác nhận gửi tới email tài khoản.
                  </p>
                </div>
              </div>

              <div className="account-security-row">
                <div className="security-left">
                  <div className="security-icon">
                    <LockIcon />
                  </div>

                  <div>
                    <strong>Mật khẩu</strong>

                    <p>••••••••••••</p>
                  </div>
                </div>

                <button type="button" className="change-password-button" onClick={openPasswordModal}>
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {passwordOpen && <ChangePasswordModal closePasswordModal={closePasswordModal} user={user} passwordError={passwordError} codeRequested={codeRequested} requestPasswordCode={requestPasswordCode} requestingCode={requestingCode} passwordForm={passwordForm} handlePasswordInput={handlePasswordInput} changingPassword={changingPassword} changePassword={changePassword} />}
    </div>;
}
export default Profile;
