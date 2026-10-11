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
// ICON CHUNG
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

// ==========================================
// USER ICON
// ==========================================

const UserIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
  </Icon>
);

// ==========================================
// PLANE ICON
// ==========================================

const PlaneIcon = () => (
  <Icon>
    <path d="M10.5 13.5 3 11l1.5-1.5 9 .5 4.5-4.5a1.8 1.8 0 0 1 2.6 2.6L15.1 12.6l.5 9L14 22.9l-2.5-7.4" />
  </Icon>
);

// ==========================================
// LOGOUT ICON
// ==========================================

const LogoutIcon = () => (
  <Icon>
    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />

    <path d="M16 17l5-5-5-5M21 12H9" />
  </Icon>
);

// ==========================================
// COMPASS ICON
// ==========================================

const CompassIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="10" />

    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </Icon>
);

// ==========================================
// BLOG ICON
// ==========================================

const BlogIcon = () => (
  <Icon>
    <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />

    <path d="M8 7h8" />

    <path d="M8 11h8" />

    <path d="M8 15h5" />
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

  // ==========================================
  // ĐÓNG PROFILE DROPDOWN KHI CLICK RA NGOÀI
  // HOẶC NHẤN ESC
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

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    setOpenProfile(false);

    setMobileMenuOpen(false);

    toast.success("Đã đăng xuất thành công");

    navigate("/home");
  };

  // ==========================================
  // BẮT ĐĂNG NHẬP
  // ==========================================

  const requireLogin = (path) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng này");

      navigate("/login");

      return;
    }

    navigate(path);
  };

  // ==========================================
  // CHUYỂN TRANG + ĐÓNG MOBILE MENU
  // ==========================================

  const navigateMobile = (path) => {
    setMobileMenuOpen(false);

    navigate(path);
  };

  // ==========================================
  // CHUYỂN TRANG CẦN LOGIN + ĐÓNG MOBILE MENU
  // ==========================================

  const requireLoginMobile = (path) => {
    setMobileMenuOpen(false);

    requireLogin(path);
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

  const isDestinationsActive = location.pathname === "/destinations";

  const isBlogActive =
    location.pathname === "/blog" || location.pathname.startsWith("/blog/");

  const isTicketsActive = location.pathname === "/my-tickets";

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
        {/* TRANG CHỦ */}

        <span
          className={isHomeActive ? "active" : ""}
          onClick={() => navigate("/home")}
        >
          Trang chủ
        </span>

        {/* ĐIỂM ĐẾN */}

        <span
          className={isDestinationsActive ? "active" : ""}
          onClick={() => navigate("/destinations")}
        >
          Điểm đến
        </span>

        {/* BLOG */}

        <span
          className={isBlogActive ? "active" : ""}
          onClick={() => navigate("/blog")}
        >
          Blog
        </span>

        {/* VÉ CỦA TÔI */}

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
            {/* ==================================
                PROFILE BUTTON
            ================================== */}

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
                PROFILE DROPDOWN
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

                {/* MENU LIST */}

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
                    Thông tin tài khoản
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
                    Vé máy bay đã đặt
                  </button>

                  {/* DESTINATIONS */}

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

                  {/* BLOG */}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenProfile(false);

                      navigate("/blog");
                    }}
                  >
                    <span className="menu-icon">
                      <BlogIcon />
                    </span>
                    Blog du lịch
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
          <div className="auth-buttons">
            {/* LOGIN */}

            <button
              type="button"
              className="btn-outline"
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </button>

            {/* REGISTER */}

            <button
              type="button"
              className="btn-solid"
              onClick={() => navigate("/register")}
            >
              Đăng ký
            </button>
          </div>
        )}

        {/* ======================================
            MOBILE MENU TOGGLE
        ====================================== */}

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((value) => !value)}
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
          {/* HOME */}

          <span
            className={isHomeActive ? "mobile-link active" : "mobile-link"}
            onClick={() => navigateMobile("/home")}
          >
            Trang chủ
          </span>

          {/* DESTINATIONS */}

          <span
            className={
              isDestinationsActive ? "mobile-link active" : "mobile-link"
            }
            onClick={() => navigateMobile("/destinations")}
          >
            Điểm đến
          </span>

          {/* BLOG */}

          <span
            className={isBlogActive ? "mobile-link active" : "mobile-link"}
            onClick={() => navigateMobile("/blog")}
          >
            Blog
          </span>

          {/* MY TICKETS */}

          <span
            className={isTicketsActive ? "mobile-link active" : "mobile-link"}
            onClick={() => requireLoginMobile("/my-tickets")}
          >
            Vé máy bay của tôi
          </span>

          {/* PROFILE */}

          {token && user && (
            <span
              className="mobile-link"
              onClick={() => navigateMobile("/profile")}
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
