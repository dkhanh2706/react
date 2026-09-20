import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Đọc user an toàn: nếu dữ liệu trong localStorage bị hỏng thì không làm sập trang
const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

function Header() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "vi",
  );

  const token = localStorage.getItem("token");

  const user = readUser();

  const changeLanguage = (e) => {
    const lang = e.target.value;

    setLanguage(lang);

    localStorage.setItem("language", lang);

    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    navigate("/login");
  };

  const text = {
    vi: {
      ticket: "Vé máy bay",
      promotion: "Khuyến mãi",
      booking: "Quản lý đặt chỗ",
      support: "Hỗ trợ",
      blog: "Blog",
      login: "Đăng nhập",
      register: "Đăng ký",
      logout: "Đăng xuất",
      hello: "Xin chào",
    },

    en: {
      ticket: "Flight Tickets",
      promotion: "Promotion",
      booking: "Manage Booking",
      support: "Support",
      blog: "Blog",
      login: "Login",
      register: "Register",
      logout: "Logout",
      hello: "Hello",
    },
  };

  const t = text[language];

  return (
    <header className="header">
      <div className="logo" onClick={() => navigate("/home")}>
        ✈️ Airline Booking
      </div>

      <nav>
        <span>{t.ticket}</span>

        <span>{t.promotion}</span>

        <span>{t.booking}</span>

        <span>{t.support}</span>

        <span>{t.blog}</span>
      </nav>

      <div className="header-action">
        <select
          value={language}
          onChange={changeLanguage}
          aria-label="Ngôn ngữ / Language"
        >
          <option value="vi">🇻🇳 VN</option>

          <option value="en">🇬🇧 EN</option>
        </select>

        <select aria-label="Currency">
          <option>VND</option>

          <option>USD</option>
        </select>

        {token && user ? (
          <div className="user-box">
            <span>
              {t.hello},<b>{" " + user.full_name}</b>
            </span>

            <button onClick={logout}>{t.logout}</button>
          </div>
        ) : (
          <>
            <button onClick={() => navigate("/login")}>{t.login}</button>

            <button onClick={() => navigate("/register")}>{t.register}</button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
