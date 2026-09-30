import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function AdminDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    toast.success("Đã đăng xuất");

    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",

        background: "#f3f4f6",

        padding: "30px",
      }}
    >
      {/* HEADER ADMIN */}

      <div
        style={{
          background: "#ffffff",

          padding: "25px",

          borderRadius: "15px",

          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          marginBottom: "30px",
        }}
      >
        <div>
          <h1>Admin Dashboard</h1>

          <p>
            Xin chào:
            <b> {user?.full_name || "Admin"}</b>
          </p>
        </div>

        <button
          onClick={logout}
          style={{
            background: "#111827",

            color: "#fff",

            border: "none",

            padding: "12px 25px",

            borderRadius: "10px",

            cursor: "pointer",
          }}
        >
          Đăng xuất
        </button>
      </div>

      {/* MENU ADMIN */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",

          gap: "25px",
        }}
      >
        {/* USER */}

        <div style={cardStyle}>
          <h2>👤 Quản lý tài khoản</h2>

          <p>Xem, sửa quyền và xóa tài khoản</p>

          <button style={buttonStyle} onClick={() => navigate("/admin/users")}>
            Quản lý
          </button>
        </div>

        {/* FLIGHT */}

        <div style={cardStyle}>
          <h2>✈️ Quản lý chuyến bay</h2>

          <p>Thêm, sửa, xóa chuyến bay</p>

          <button style={buttonStyle}>Đang phát triển</button>
        </div>

        {/* BOOKING */}

        <div style={cardStyle}>
          <h2>🎫 Quản lý đặt vé</h2>

          <p>Kiểm tra các đơn đặt vé</p>

          <button style={buttonStyle}>Đang phát triển</button>
        </div>

        {/* PAYMENT */}

        <div style={cardStyle}>
          <h2>💳 Thanh toán</h2>

          <p>Theo dõi giao dịch</p>

          <button style={buttonStyle}>Đang phát triển</button>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#ffffff",

  padding: "25px",

  borderRadius: "15px",

  boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
};

const buttonStyle = {
  marginTop: "15px",

  padding: "10px 20px",

  border: "none",

  borderRadius: "8px",

  cursor: "pointer",

  background: "#2563eb",

  color: "#fff",
};

export default AdminDashboard;
