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
// ICONS
// ==========================================

const Icon = ({ children, size = 18 }) => (
  <svg
    className="menu-icon-svg"
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

const LogoutIcon = () => (
  <Icon>
    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </Icon>
);

const CompassIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Đóng dropdown khi click ra ngoài / ESC
  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenProfile(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenProfile(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Đóng mobile menu khi chuyển route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setOpenProfile(false);
    toast.success("Đã đăng xuất thành công");
    navigate("/home");
  };

  // BẮT ĐĂNG NHẬP
  const requireLogin = (path) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
      navigate("/login");
      return;
    }
    navigate(path);
  };

  // USER INFO
  const userName = user?.full_name || user?.name || user?.email || "Tài khoản";
  const userEmail = user?.email || "";
  const avatarLetter = userName.trim().charAt(0).toUpperCase() || "U";

  // ACTIVE MENU
  const isHomeActive = location.pathname === "/" || location.pathname === "/home";
  const isTicketsActive = location.pathname === "/my-tickets";
  const isDestinationsActive = location.pathname === "/destinations";

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
          DESKTOP NAVIGATION
      ====================================== */}
      <nav className="desktop-nav">
        <span
          className={isHomeActive ? "active" : ""}
          onClick={() => navigate("/home")}
        >
          Trang chủ
        </span>

        <span
          className={isDestinationsActive ? "active" : ""}
          onClick={() => navigate("/destinations")}
        >
          Điểm đến
        </span>

        <span
          className={isTicketsActive ? "active" : ""}
          onClick={() => requireLogin("/my-tickets")}
        >
          Vé máy bay của tôi
        </span>
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
                <small>Xin chào,</small>
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
                <div className="profile-menu-head">
                  <span className="profile-avatar large">{avatarLetter}</span>
                  <div className="profile-menu-info">
                    <strong>{userName}</strong>
                    {userEmail && <small>{userEmail}</small>}
                  </div>
                </div>

                <div className="profile-menu-list">
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
                    Thông tin tài khoản
                  </button>

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
                    Vé máy bay đã đặt
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenProfile(false);
                      navigate("/destinations");
                    }}
                  >
                    <span className="menu-icon">
                      <CompassIcon />
                    </span>
                    Khám phá chuyến bay
                  </button>
                </div>

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
          <div className="auth-buttons">
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
          </div>
        )}

        {/* MOBILE MENU TOGGLE */}
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* ======================================
          MOBILE MENU DRAWER
      ====================================== */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <span
            className={isHomeActive ? "mobile-link active" : "mobile-link"}
            onClick={() => navigate("/home")}
          >
            Trang chủ
          </span>

          <span
            className={isDestinationsActive ? "mobile-link active" : "mobile-link"}
            onClick={() => navigate("/destinations")}
          >
            Điểm đến
          </span>

          <span
            className={isTicketsActive ? "mobile-link active" : "mobile-link"}
            onClick={() => requireLogin("/my-tickets")}
          >
            Vé máy bay của tôi
          </span>

          {token && user && (
            <span
              className="mobile-link"
              onClick={() => navigate("/profile")}
            >
              Hồ sơ cá nhân
            </span>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;
