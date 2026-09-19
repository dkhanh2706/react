import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        "/auth/login",

        {
          email,
          password,
        },
      );

      localStorage.setItem("token", response.data.token);

      localStorage.setItem("user", JSON.stringify(response.data.user));

      alert("Đăng nhập thành công");

      navigate("/home");
    } catch (error) {
      console.log(error);

      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Không kết nối được server");
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>✈️ Airline Booking</h2>

        <p>Đăng nhập tài khoản</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="📧 Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="🔒 Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Đăng nhập</button>
        </form>

        <p>
          Chưa có tài khoản?
          <span onClick={() => navigate("/register")}>Đăng ký ngay</span>
        </p>

        <p>
          <span onClick={() => navigate("/forgot-password")}>
            🔑 Quên mật khẩu?
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
