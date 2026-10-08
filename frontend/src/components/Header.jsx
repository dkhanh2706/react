import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import "../styles/Header.css";

// ==========================================
// ĐỌC USER
// ==========================================

const readUser = () => {
  try {
    const value = localStorage.getItem("user");

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  } catch {
    return null;
  }
};

// ==========================================
// ICON
// ==========================================

const Icon = ({ children }) => (
  <svg
    className="menu-icon-svg"
    viewBox="0 0 24 24"
    width="18"
    height="18"
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

const ClipboardIcon = () => (
  <Icon>
    <rect x="5" y="4" width="14" height="17" rx="2" />

    <path d="M9 4.5h6M9 11h6M9 15h4" />
  </Icon>
);

const LogoutIcon = () => (
  <Icon>
    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />

    <path d="M16 17l5-5-5-5M21 12H9" />
  </Icon>
);

// ==========================================
// HEADER
// ==========================================

function Header() {
  const navigate = useNavigate();

  const location = useLocation();

  const menuRef = useRef(null);

  const token = localStorage.getItem("token");

  const user = readUser();

  const [openProfile, setOpenProfile] = useState(false);

  // ==========================================
  // ĐÓNG MENU KHI CLICK RA NGOÀI / ESC
  // ==========================================

  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenProfile(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenProfile(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);

      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    setOpenProfile(false);

    toast.success("Đã đăng xuất");

    navigate("/home");
  };

  // ==========================================
  // BẮT ĐĂNG NHẬP
  // ==========================================

  const requireLogin = (path) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để sử dụng chức năng này");

      navigate("/login");

      return;
    }

    navigate(path);
  };

  // ==========================================
  // USER INFO
  // ==========================================

  const userName = user?.full_name || user?.name || user?.email || "Tài khoản";

  const userEmail = user?.email || "";

  const avatarLetter = userName.trim().charAt(0).toUpperCase() || "U";

  // ==========================================
  // ACTIVE MENU
  // ==========================================

  const isHomeActive =
    location.pathname === "/" || location.pathname === "/home";

  const isActive = (path) => location.pathname.startsWith(path);

  // ==========================================
  // UI
  // ==========================================

  return (
    <header className="header">
      {/* ======================================
          LOGO
      ====================================== */}

      <div className="logo" onClick={() => navigate("/home")}>
        <span className="logo-mark">✈</span>

        <span className="logo-text">Airline Booking</span>
      </div>

      {/* ======================================
          NAVIGATION
      ====================================== */}

      <nav>
        {/* HOME */}

        <span
          className={isHomeActive ? "active" : ""}
          onClick={() => navigate("/home")}
        >
          Home
        </span>

        {/* VÉ MÁY BAY */}

        <span
          className={isActive("/my-tickets") ? "active" : ""}
          onClick={() => requireLogin("/my-tickets")}
        >
          Vé máy bay
        </span>

        {/* ĐIỂM ĐẾN */}

        <span
          className={isActive("/destinations") ? "active" : ""}
          onClick={() => navigate("/destinations")}
        >
          Điểm đến
        </span>

        {/* DỊCH VỤ THÊM */}

        <span
          className={isActive("/my-bookings") ? "active" : ""}
          onClick={() => requireLogin("/my-bookings")}
        >
          Dịch vụ thêm
        </span>

        {/* BLOG */}

        <span>Blog</span>
      </nav>

      {/* ======================================
          ACTION
      ====================================== */}

      <div className="header-action">
        {token && user ? (
          <div className="profile-wrapper" ref={menuRef}>
            {/* PROFILE BUTTON */}

            <button
              type="button"
              className={`profile-button ${openProfile ? "is-open" : ""}`}
              aria-haspopup="menu"
              aria-expanded={openProfile}
              onClick={() => setOpenProfile((current) => !current)}
            >
              <span className="profile-avatar">{avatarLetter}</span>

              <span className="profile-text">
                <small>Hồ sơ cá nhân</small>

                <strong>{userName}</strong>
              </span>

              <svg
                className="profile-arrow"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* ==================================
                DROPDOWN
            ================================== */}

            {openProfile && (
              <div className="profile-menu" role="menu">
                {/* USER INFO */}

                <div className="profile-menu-head">
                  <span className="profile-avatar large">{avatarLetter}</span>

                  <div className="profile-menu-info">
                    <strong>{userName}</strong>

                    {userEmail && <small>{userEmail}</small>}
                  </div>
                </div>

                {/* ==================================
                    MENU
                ================================== */}

                <div className="profile-menu-list">
                  {/* PROFILE */}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenProfile(false);

                      navigate("/profile");
                    }}
                  >
                    <span className="menu-icon">
                      <UserIcon />
                    </span>
                    Hồ sơ cá nhân
                  </button>

                  {/* MY TICKETS */}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenProfile(false);

                      navigate("/my-tickets");
                    }}
                  >
                    <span className="menu-icon">
                      <PlaneIcon />
                    </span>
                    Vé máy bay của tôi
                  </button>

                  {/* BOOKING */}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenProfile(false);

                      navigate("/my-bookings");
                    }}
                  >
                    <span className="menu-icon">
                      <ClipboardIcon />
                    </span>
                    Quản lý đặt chỗ
                  </button>
                </div>

                {/* ==================================
                    LOGOUT
                ================================== */}

                <button
                  type="button"
                  role="menuitem"
                  className="logout-item"
                  onClick={logout}
                >
                  <span className="menu-icon">
                    <LogoutIcon />
                  </span>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              type="button"
              className="btn-outline"
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </button>

            <button
              type="button"
              className="btn-solid"
              onClick={() => navigate("/register")}
            >
              Đăng ký
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
