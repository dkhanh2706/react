import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function ResetPassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: localStorage.getItem("resetEmail") || "",

    code: "",

    newPassword: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,

      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        "/auth/reset-password",

        form,
      );

      alert(response.data.message);

      localStorage.removeItem("resetEmail");

      navigate("/login");
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>🔐 Đổi mật khẩu</h2>

        <p>Nhập mã reset và mật khẩu mới</p>

        <form onSubmit={handleSubmit}>
          <input
            name="email"
            placeholder="📧 Email"
            value={form.email}
            onChange={handleChange}
          />

          <input
            name="code"
            placeholder="🔢 Mã reset"
            value={form.code}
            onChange={handleChange}
          />

          <input
            name="newPassword"
            type="password"
            placeholder="🔒 Mật khẩu mới"
            value={form.newPassword}
            onChange={handleChange}
          />

          <button>Đổi mật khẩu</button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
