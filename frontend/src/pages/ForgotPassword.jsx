import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const handleForgot = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/forgot-password", {
        email,
      });

      alert("Mã reset của bạn là: " + res.data.code);

      navigate("/reset-password");
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>🔑 Quên mật khẩu</h2>

        <p>Nhập email để nhận mã đặt lại mật khẩu</p>

        <form onSubmit={handleForgot}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit">Lấy mã reset</button>
        </form>

        <p>
          <span
            onClick={() => {
              navigate("/login");
            }}
          >
            Quay lại đăng nhập
          </span>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
