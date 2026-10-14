import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Header from "../components/Header";
import Footer from "../components/Footer";

import "../styles/Profile.css";

// =====================================================
// API
// =====================================================

const API_ORIGIN = `${window.location.protocol}//${window.location.hostname}:5000`;

const PROFILE_API = `${API_ORIGIN}/api/users/profile`;

const AVATAR_API = `${API_ORIGIN}/api/users/profile/avatar`;

const PASSWORD_CODE_API = `${API_ORIGIN}/api/users/password/request-code`;

const PASSWORD_CHANGE_API = `${API_ORIGIN}/api/users/password/change`;

// =====================================================
// ICON
// =====================================================

const Icon = ({ children, size = 20 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const UserIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
  </Icon>
);

const PlaneIcon = () => (
  <Icon>
    <path d="M10.5 13.5 3 11l1.5-1.5 9 .5 4.5-4.5a1.8 1.8 0 0 1 2.6 2.6L15.1 12.6l.5 9L14 22.9l-2.5-7.4" />
  </Icon>
);

const BookingIcon = () => (
  <Icon>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4.5h6M9 11h6M9 15h4" />
  </Icon>
);

const LockIcon = () => (
  <Icon>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Icon>
);

const EditIcon = () => (
  <Icon size={18}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </Icon>
);

const MailIcon = () => (
  <Icon size={18}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
);

const PhoneIcon = () => (
  <Icon size={18}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
  </Icon>
);

const CalendarIcon = () => (
  <Icon size={18}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </Icon>
);

// =====================================================
// AVATAR
// =====================================================

const ProfileAvatar = ({ avatarSource, avatarLetter, large = false }) => {
  return (
    <div
      className={
        large
          ? "account-profile-avatar profile-avatar-image-wrapper"
          : "account-avatar profile-avatar-image-wrapper"
      }
    >
      {avatarSource ? (
        <img
          src={avatarSource}
          alt="Ảnh đại diện"
          className="profile-avatar-image"
        />
      ) : (
        <span>{avatarLetter}</span>
      )}
    </div>
  );
};

// =====================================================
// LOCAL STORAGE
// =====================================================

const getStoredUser = () => {
  try {
    const value = localStorage.getItem("user");

    if (!value) {
      return {};
    }

    return JSON.parse(value);
  } catch {
    return {};
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// =====================================================
// TOKEN
// =====================================================

const isTokenExpired = (token) => {
  try {
    if (!token) {
      return true;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      return true;
    }

    const payloadPart = parts[1];

    const normalizedPayload = payloadPart.replace(/-/g, "+").replace(/_/g, "/");

    const decodedPayload = JSON.parse(
      decodeURIComponent(
        atob(normalizedPayload)
          .split("")
          .map(
            (char) => "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2),
          )
          .join(""),
      ),
    );

    if (!decodedPayload.exp) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);

    return decodedPayload.exp <= currentTime;
  } catch {
    return true;
  }
};

// =====================================================
// AVATAR URL
// =====================================================

const getAvatarUrl = (value) => {
  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${API_ORIGIN}${value}`;
};

// =====================================================
// PROFILE
// =====================================================

function Profile() {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const storedUser = getStoredUser();

  // ===================================================
  // USER
  // ===================================================

  const [user, setUser] = useState({
    id: storedUser.id || null,
    full_name: storedUser.full_name || storedUser.name || "",
    email: storedUser.email || "",
    phone: storedUser.phone || "",
    birth_date: storedUser.birth_date || "",
    gender: storedUser.gender || "",
    role: storedUser.role || "CUSTOMER",
    avatar_url: storedUser.avatar_url || "",
  });

  // ===================================================
  // PROFILE FORM
  // ===================================================

  const [form, setForm] = useState({
    full_name: storedUser.full_name || storedUser.name || "",
    phone: storedUser.phone || "",
    birth_date: storedUser.birth_date || "",
    gender: storedUser.gender || "",
  });

  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  // ===================================================
  // AVATAR
  // ===================================================

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState("");

  // ===================================================
  // PASSWORD
  // ===================================================

  const [passwordOpen, setPasswordOpen] = useState(false);

  const [codeRequested, setCodeRequested] = useState(false);

  const [requestingCode, setRequestingCode] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);

  const [passwordError, setPasswordError] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    code: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ===================================================
  // SESSION
  // ===================================================

  const handleInvalidSession = (
    message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  ) => {
    clearAuthStorage();

    toast.error(message);

    navigate("/login", {
      replace: true,
    });
  };

  const getValidToken = () => {
    const token = localStorage.getItem("token");

    if (!token || isTokenExpired(token)) {
      handleInvalidSession();

      return null;
    }

    return token;
  };

  // ===================================================
  // LOAD PROFILE
  // ===================================================

  useEffect(() => {
    let active = true;

    const controller = new AbortController();

    const loadProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token || isTokenExpired(token)) {
        if (active) {
          setLoading(false);
        }

        clearAuthStorage();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      try {
        const response = await fetch(PROFILE_API, {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          signal: controller.signal,
        });

        let data = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (response.status === 401 || response.status === 403) {
          if (!active) {
            return;
          }

          clearAuthStorage();

          toast.error(
            data.message ||
              "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          );

          navigate("/login", {
            replace: true,
          });

          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải hồ sơ");
        }

        if (!active) {
          return;
        }

        const profile = data.user || {};

        setUser(profile);

        setForm({
          full_name: profile.full_name || "",
          phone: profile.phone || "",
          birth_date: profile.birth_date || "",
          gender: profile.gender || "",
        });

        localStorage.setItem("user", JSON.stringify(profile));
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("LOAD PROFILE ERROR:", error);

        if (active) {
          toast.error(error.message || "Không thể tải hồ sơ");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;

      controller.abort();
    };
  }, [navigate]);

  // ===================================================
  // PROFILE INPUT
  // ===================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setForm({
      full_name: user.full_name || "",
      phone: user.phone || "",
      birth_date: user.birth_date || "",
      gender: user.gender || "",
    });

    setEditing(true);
  };

  const handleCancel = () => {
    setForm({
      full_name: user.full_name || "",
      phone: user.phone || "",
      birth_date: user.birth_date || "",
      gender: user.gender || "",
    });

    setEditing(false);
  };

  // ===================================================
  // SAVE PROFILE
  // ===================================================

  const handleSave = async () => {
    if (saving) {
      return;
    }

    const fullName = form.full_name.trim();

    const phone = form.phone.trim();

    if (!fullName) {
      toast.error("Vui lòng nhập họ và tên");

      return;
    }

    if (!/^0\d{9}$/.test(phone)) {
      toast.error("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0");

      return;
    }

    const token = getValidToken();

    if (!token) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(PROFILE_API, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          full_name: fullName,
          phone,
          birth_date: form.birth_date || null,
          gender: form.gender || null,
        }),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401 || response.status === 403) {
        handleInvalidSession(data.message);

        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Không thể cập nhật thông tin");
      }

      const updatedUser = data.user;

      if (!updatedUser) {
        throw new Error("Server không trả về thông tin người dùng");
      }

      setUser(updatedUser);

      setForm({
        full_name: updatedUser.full_name || "",
        phone: updatedUser.phone || "",
        birth_date: updatedUser.birth_date || "",
        gender: updatedUser.gender || "",
      });

      localStorage.setItem("user", JSON.stringify(updatedUser));

      window.dispatchEvent(new CustomEvent("userUpdated"));

      setEditing(false);

      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      console.error("SAVE PROFILE ERROR:", error);

      toast.error(error.message || "Không thể cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // AVATAR SELECT
  // ===================================================

  const handleAvatarSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.type)) {
      toast.error("Chỉ chọn JPG, PNG hoặc WEBP");

      event.target.value = "";

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 2MB");

      event.target.value = "";

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setAvatarPreview(reader.result);
    };

    reader.readAsDataURL(file);

    uploadAvatar(file);
  };

  // ===================================================
  // UPLOAD AVATAR
  // ===================================================

  const uploadAvatar = async (file) => {
    const token = getValidToken();

    if (!token) {
      return;
    }

    try {
      setUploadingAvatar(true);

      const body = new FormData();

      body.append("avatar", file);

      const response = await fetch(AVATAR_API, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        body,
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401 || response.status === 403) {
        handleInvalidSession(data.message);

        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải ảnh đại diện");
      }

      const updatedUser = data.user;

      if (!updatedUser) {
        throw new Error("Server không trả về thông tin người dùng");
      }

      setUser(updatedUser);

      localStorage.setItem("user", JSON.stringify(updatedUser));

      window.dispatchEvent(new CustomEvent("userUpdated"));

      setAvatarPreview("");

      toast.success("Đổi ảnh đại diện thành công");
    } catch (error) {
      console.error("UPLOAD AVATAR ERROR:", error);

      setAvatarPreview("");

      toast.error(error.message || "Không thể đổi ảnh đại diện");
    } finally {
      setUploadingAvatar(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ===================================================
  // PASSWORD MODAL
  // ===================================================

  const openPasswordModal = () => {
    setPasswordForm({
      code: "",
      newPassword: "",
      confirmPassword: "",
    });

    setCodeRequested(false);

    setPasswordError("");

    setPasswordOpen(true);
  };

  const closePasswordModal = () => {
    if (requestingCode || changingPassword) {
      return;
    }

    setPasswordOpen(false);

    setCodeRequested(false);

    setPasswordError("");

    setPasswordForm({
      code: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  // ===================================================
  // REQUEST PASSWORD CODE
  // ===================================================

  const requestPasswordCode = async () => {
    if (requestingCode) {
      return;
    }

    const token = getValidToken();

    if (!token) {
      return;
    }

    try {
      setRequestingCode(true);

      setPasswordError("");

      const response = await fetch(PASSWORD_CODE_API, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401 || response.status === 403) {
        handleInvalidSession(data.message);

        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi mã xác nhận");
      }

      setCodeRequested(true);

      toast.success(
        data.message || "Mã xác nhận đã được gửi đến email của bạn",
      );
    } catch (error) {
      console.error("REQUEST CODE ERROR:", error);

      const message = error.message || "Không thể gửi mã xác nhận";

      setPasswordError(message);

      toast.error(message);
    } finally {
      setRequestingCode(false);
    }
  };

  // ===================================================
  // PASSWORD INPUT
  // ===================================================

  const handlePasswordInput = (event) => {
    const { name, value } = event.target;

    let nextValue = value;

    if (name === "code") {
      nextValue = value.replace(/\D/g, "").slice(0, 6);
    }

    setPasswordForm((current) => ({
      ...current,
      [name]: nextValue,
    }));

    if (passwordError) {
      setPasswordError("");
    }
  };

  // ===================================================
  // CHANGE PASSWORD
  // ===================================================

  const changePassword = async () => {
    if (changingPassword) {
      return;
    }

    const { code, newPassword, confirmPassword } = passwordForm;

    if (!/^\d{6}$/.test(code)) {
      const message = "Mã xác nhận phải gồm 6 chữ số";

      setPasswordError(message);

      toast.error(message);

      return;
    }

    if (newPassword.length < 8) {
      const message = "Mật khẩu mới phải có ít nhất 8 ký tự";

      setPasswordError(message);

      toast.error(message);

      return;
    }

    if (newPassword !== confirmPassword) {
      const message = "Xác nhận mật khẩu không khớp";

      setPasswordError(message);

      toast.error(message);

      return;
    }

    const token = getValidToken();

    if (!token) {
      return;
    }

    try {
      setChangingPassword(true);

      setPasswordError("");

      const response = await fetch(PASSWORD_CHANGE_API, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          code,
          newPassword,
          confirmPassword,
        }),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401 || response.status === 403) {
        handleInvalidSession(data.message);

        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Không thể đổi mật khẩu");
      }

      toast.success(
        data.message || "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
      );

      clearAuthStorage();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("CHANGE PASSWORD ERROR:", error);

      const message = error.message || "Không thể đổi mật khẩu";

      setPasswordError(message);

      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  // ===================================================
  // DISPLAY
  // ===================================================

  const displayName = user.full_name || user.email || "Người dùng";

  const avatarLetter = displayName.trim().charAt(0).toUpperCase() || "U";

  const avatarSource = avatarPreview || getAvatarUrl(user.avatar_url);

  const formatBirthDate = (value) => {
    if (!value) {
      return "Chưa cập nhật";
    }

    const parts = value.substring(0, 10).split("-");

    if (parts.length !== 3) {
      return value;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="profile-page-wrapper">
      <Header />

      <main className="profile-page">
        <div className="profile-page-container">
          <aside className="account-sidebar">
            <div className="account-sidebar-user">
              <ProfileAvatar
                avatarSource={avatarSource}
                avatarLetter={avatarLetter}
              />

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

              <button
                type="button"
                className="account-menu-item"
                onClick={() => navigate("/my-tickets")}
              >
                <span className="account-menu-icon">
                  <PlaneIcon />
                </span>

                <span>Vé máy bay của tôi</span>
              </button>

              <button
                type="button"
                className="account-menu-item"
                onClick={() => navigate("/my-bookings")}
              >
                <span className="account-menu-icon">
                  <BookingIcon />
                </span>

                <span>Quản lý đặt chỗ</span>
              </button>

              <button
                type="button"
                className="account-menu-item"
                onClick={openPasswordModal}
              >
                <span className="account-menu-icon">
                  <LockIcon />
                </span>

                <span>Bảo mật tài khoản</span>
              </button>
            </div>
          </aside>

          <section className="account-content">
            <div className="account-page-heading">
              <div>
                <h1>Hồ sơ cá nhân</h1>

                <p>Quản lý thông tin cá nhân và thông tin tài khoản của bạn.</p>
              </div>

              {!editing && (
                <button
                  type="button"
                  className="account-edit-button"
                  onClick={handleEdit}
                >
                  <EditIcon />

                  <span>Chỉnh sửa thông tin</span>
                </button>
              )}
            </div>

            <div className="account-profile-card">
              <div className="account-profile-top">
                <div className="profile-avatar-area">
                  <ProfileAvatar
                    avatarSource={avatarSource}
                    avatarLetter={avatarLetter}
                    large
                  />

                  <button
                    type="button"
                    className="profile-avatar-change-button"
                    disabled={uploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingAvatar ? "Đang tải..." : "📷 Đổi ảnh"}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handleAvatarSelect}
                  />
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
            </div>

            <div className="account-card">
              <div className="account-card-header">
                <div>
                  <h2>Thông tin cá nhân</h2>

                  <p>Thông tin được sử dụng khi đặt vé máy bay.</p>
                </div>
              </div>

              {loading ? (
                <div className="profile-loading">Đang tải thông tin...</div>
              ) : (
                <div className="account-info-grid">
                  <div className="account-info-item">
                    <div className="account-info-icon">
                      <UserIcon />
                    </div>

                    <div className="account-info-text">
                      <span>Họ và tên</span>

                      {editing ? (
                        <input
                          className="profile-edit-input"
                          name="full_name"
                          value={form.full_name}
                          onChange={handleChange}
                          maxLength={100}
                        />
                      ) : (
                        <strong>{user.full_name || "Chưa cập nhật"}</strong>
                      )}
                    </div>
                  </div>

                  <div className="account-info-item">
                    <div className="account-info-icon">
                      <MailIcon />
                    </div>

                    <div className="account-info-text">
                      <span>Email</span>

                      <strong>{user.email || "Chưa cập nhật"}</strong>

                      {editing && (
                        <small className="profile-email-note">
                          Email không thể chỉnh sửa
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="account-info-item">
                    <div className="account-info-icon">
                      <PhoneIcon />
                    </div>

                    <div className="account-info-text">
                      <span>Số điện thoại</span>

                      {editing ? (
                        <input
                          className="profile-edit-input"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          maxLength={10}
                          inputMode="numeric"
                        />
                      ) : (
                        <strong>{user.phone || "Chưa cập nhật"}</strong>
                      )}
                    </div>
                  </div>

                  <div className="account-info-item">
                    <div className="account-info-icon">
                      <CalendarIcon />
                    </div>

                    <div className="account-info-text">
                      <span>Ngày sinh</span>

                      {editing ? (
                        <input
                          type="date"
                          className="profile-edit-input"
                          name="birth_date"
                          value={
                            form.birth_date
                              ? form.birth_date.substring(0, 10)
                              : ""
                          }
                          onChange={handleChange}
                        />
                      ) : (
                        <strong>{formatBirthDate(user.birth_date)}</strong>
                      )}
                    </div>
                  </div>

                  <div className="account-info-item">
                    <div className="account-info-icon">
                      <UserIcon />
                    </div>

                    <div className="account-info-text">
                      <span>Giới tính</span>

                      {editing ? (
                        <select
                          className="profile-edit-input"
                          name="gender"
                          value={form.gender || ""}
                          onChange={handleChange}
                        >
                          <option value="">Chưa chọn</option>
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      ) : (
                        <strong>{user.gender || "Chưa cập nhật"}</strong>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {editing && (
                <div className="profile-edit-actions">
                  <button
                    type="button"
                    className="profile-cancel-button"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    className="profile-save-button"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              )}
            </div>

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

                <button
                  type="button"
                  className="change-password-button"
                  onClick={openPasswordModal}
                >
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {passwordOpen && (
        <div
          className="password-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePasswordModal();
            }
          }}
        >
          <div className="password-modal">
            <button
              type="button"
              className="password-modal-close"
              onClick={closePasswordModal}
            >
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

            {passwordError && (
              <div className="password-error-box" role="alert">
                <span className="password-error-icon">⚠</span>

                <p>{passwordError}</p>
              </div>
            )}

            {!codeRequested ? (
              <button
                type="button"
                className="password-send-code-button"
                onClick={requestPasswordCode}
                disabled={requestingCode}
              >
                {requestingCode ? "Đang gửi mã..." : "Gửi mã xác nhận"}
              </button>
            ) : (
              <>
                <div className="password-form-field">
                  <label>Mã xác nhận</label>

                  <input
                    type="text"
                    name="code"
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="Nhập mã 6 số"
                    value={passwordForm.code}
                    onChange={handlePasswordInput}
                  />
                </div>

                <div className="password-form-field">
                  <label>Mật khẩu mới</label>

                  <input
                    type="password"
                    name="newPassword"
                    placeholder="Ít nhất 8 ký tự"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInput}
                  />
                </div>

                <div className="password-form-field">
                  <label>Xác nhận mật khẩu mới</label>

                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Nhập lại mật khẩu mới"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInput}
                  />
                </div>

                <button
                  type="button"
                  className="password-confirm-button"
                  disabled={changingPassword}
                  onClick={changePassword}
                >
                  {changingPassword
                    ? "Đang đổi mật khẩu..."
                    : "Xác nhận đổi mật khẩu"}
                </button>

                <button
                  type="button"
                  className="password-resend-button"
                  disabled={requestingCode}
                  onClick={requestPasswordCode}
                >
                  {requestingCode ? "Đang gửi..." : "Gửi lại mã"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
