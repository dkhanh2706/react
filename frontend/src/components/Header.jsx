import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// đọc user an toàn
const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

function Header() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const user = readUser();

  const logout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    toast.success("Đã đăng xuất");

    navigate("/login");
  };

  const requireLogin = (path) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để sử dụng chức năng này");

      setTimeout(() => {
        navigate("/login");
      }, 1000);

      return;
    }

    navigate(path);
  };

  return (
    <header className="header">
      <div className="logo" onClick={() => navigate("/home")}>
        ✈️ Airline Booking
      </div>

      <nav>
        <span onClick={() => navigate("/home")}>Vé máy bay</span>

        <span>Khuyến mãi</span>

        <span onClick={() => requireLogin("/my-bookings")}>
          Quản lý đặt chỗ
        </span>

        <span>Hỗ trợ</span>

        <span>Blog</span>
      </nav>

      <div className="header-action">
        <span className="currency">🇻🇳 VNĐ</span>

        {token && user ? (
          <div className="user-box">
            <span>
              Xin chào,
              <b>{" " + user.full_name}</b>
            </span>

            <button onClick={logout}>Đăng xuất</button>
          </div>
        ) : (
          <>
            <button onClick={() => navigate("/login")}>Đăng nhập</button>

            <button onClick={() => navigate("/register")}>Đăng ký</button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
