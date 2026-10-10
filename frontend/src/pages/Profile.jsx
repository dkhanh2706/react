import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/Profile.css";

// =====================================================
// API
// TỰ HOẠT ĐỘNG CẢ LOCALHOST VÀ MÁY KHÁC TRONG LAN
// =====================================================

const PROFILE_API = `${window.location.protocol}//${window.location.hostname}:5000/api/users/profile`;

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

// =====================================================
// XÓA PHIÊN ĐĂNG NHẬP
// =====================================================

const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// =====================================================
// KIỂM TRA TOKEN HẾT HẠN Ở FRONTEND
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
  } catch (error) {
    console.error("TOKEN PARSE ERROR:", error);

    return true;
  }
};

// =====================================================
// PROFILE
// =====================================================

function Profile() {
  const navigate = useNavigate();

  const storedUser = getStoredUser();

  const [user, setUser] = useState({
    id: storedUser.id || null,
    full_name: storedUser.full_name || storedUser.name || "",
    email: storedUser.email || "",
    phone: storedUser.phone || "",
    birth_date: storedUser.birth_date || "",
    gender: storedUser.gender || "",
    role: storedUser.role || "CUSTOMER",
  });

  const [form, setForm] = useState({
    full_name: storedUser.full_name || storedUser.name || "",
    phone: storedUser.phone || "",
    birth_date: storedUser.birth_date || "",
    gender: storedUser.gender || "",
  });

  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  // =====================================================
  // XỬ LÝ PHIÊN ĐĂNG NHẬP HẾT HẠN / TOKEN SAI
  // =====================================================

  const handleInvalidSession = (
    message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  ) => {
    clearAuthStorage();

    toast.error(message);

    navigate("/login", {
      replace: true,
    });
  };

  // =====================================================
  // LOAD PROFILE TỪ DATABASE
  // =====================================================

  useEffect(() => {
    let active = true;

    const controller = new AbortController();

    const loadProfile = async () => {
      const token = localStorage.getItem("token");

      // Không có token
      if (!token) {
        if (active) {
          setLoading(false);
        }

        clearAuthStorage();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      // Token hết hạn ngay từ frontend
      if (isTokenExpired(token)) {
        if (active) {
          setLoading(false);
        }

        clearAuthStorage();

        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

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

        // =====================================================
        // TOKEN HẾT HẠN / KHÔNG HỢP LỆ
        // =====================================================

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

        // =====================================================
        // LỖI KHÁC
        // =====================================================

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

  // =====================================================
  // INPUT
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =====================================================
  // BẬT CHỈNH SỬA
  // =====================================================

  const handleEdit = () => {
    setForm({
      full_name: user.full_name || "",
      phone: user.phone || "",
      birth_date: user.birth_date || "",
      gender: user.gender || "",
    });

    setEditing(true);
  };

  // =====================================================
  // HỦY
  // =====================================================

  const handleCancel = () => {
    setForm({
      full_name: user.full_name || "",
      phone: user.phone || "",
      birth_date: user.birth_date || "",
      gender: user.gender || "",
    });

    setEditing(false);
  };

  // =====================================================
  // SAVE
  // =====================================================

  const handleSave = async () => {
    if (saving) {
      return;
    }

    const fullName = form.full_name.trim();

    const phone = form.phone.trim();

    // =====================================================
    // VALIDATE NAME
    // =====================================================

    if (!fullName) {
      toast.error("Vui lòng nhập họ và tên");

      return;
    }

    // =====================================================
    // VALIDATE PHONE
    // =====================================================

    if (!/^0\d{9}$/.test(phone)) {
      toast.error("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0");

      return;
    }

    const token = localStorage.getItem("token");

    // =====================================================
    // KHÔNG CÓ TOKEN
    // =====================================================

    if (!token) {
      handleInvalidSession("Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.");

      return;
    }

    // =====================================================
    // TOKEN HẾT HẠN
    // =====================================================

    if (isTokenExpired(token)) {
      handleInvalidSession(
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      );

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
          phone: phone,
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

      // =====================================================
      // TOKEN HẾT HẠN / TOKEN SAI
      // =====================================================

      if (response.status === 401 || response.status === 403) {
        handleInvalidSession(
          data.message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        );

        return;
      }

      // =====================================================
      // LỖI KHÁC
      // =====================================================

      if (!response.ok) {
        throw new Error(data.message || "Không thể cập nhật thông tin");
      }

      const updatedUser = data.user;

      if (!updatedUser) {
        throw new Error("Server không trả về thông tin người dùng");
      }

      // =====================================================
      // CẬP NHẬT STATE
      // =====================================================

      setUser(updatedUser);

      setForm({
        full_name: updatedUser.full_name || "",
        phone: updatedUser.phone || "",
        birth_date: updatedUser.birth_date || "",
        gender: updatedUser.gender || "",
      });

      // =====================================================
      // ĐỒNG BỘ LOCAL STORAGE
      // =====================================================

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setEditing(false);

      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      console.error("SAVE PROFILE ERROR:", error);

      toast.error(error.message || "Không thể cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DISPLAY
  // =====================================================

  const displayName = user.full_name || user.email || "Người dùng";

  const avatarLetter = displayName.trim().charAt(0).toUpperCase() || "U";

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

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="profile-page-wrapper">
      <Header />

      <main className="profile-page">
        <div className="profile-page-container">
          {/* =====================================================
              SIDEBAR
          ===================================================== */}

          <aside className="account-sidebar">
            <div className="account-sidebar-user">
              <div className="account-avatar">{avatarLetter}</div>

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

              <button type="button" className="account-menu-item">
                <span className="account-menu-icon">
                  <LockIcon />
                </span>

                <span>Bảo mật tài khoản</span>
              </button>
            </div>
          </aside>

          {/* =====================================================
              CONTENT
          ===================================================== */}

          <section className="account-content">
            {/* =====================================================
                HEADING
            ===================================================== */}

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

            {/* =====================================================
                PROFILE CARD
            ===================================================== */}

            <div className="account-profile-card">
              <div className="account-profile-top">
                <div className="account-profile-avatar">{avatarLetter}</div>

                <div className="account-profile-name">
                  <h2>{displayName}</h2>

                  <p>{user.email}</p>

                  <span className="account-status">
                    Tài khoản đang hoạt động
                  </span>
                </div>
              </div>
            </div>

            {/* =====================================================
                PERSONAL INFO
            ===================================================== */}

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
                  {/* =====================================================
                      FULL NAME
                  ===================================================== */}

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

                  {/* =====================================================
                      EMAIL
                  ===================================================== */}

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

                  {/* =====================================================
                      PHONE
                  ===================================================== */}

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

                  {/* =====================================================
                      BIRTH
                  ===================================================== */}

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

                  {/* =====================================================
                      GENDER
                  ===================================================== */}

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

              {/* =====================================================
                  SAVE / CANCEL
              ===================================================== */}

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

            {/* =====================================================
                SECURITY
            ===================================================== */}

            <div className="account-card">
              <div className="account-card-header">
                <div>
                  <h2>Bảo mật tài khoản</h2>

                  <p>Thay đổi mật khẩu để bảo vệ tài khoản của bạn.</p>
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

                <button type="button" className="change-password-button">
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Profile;
