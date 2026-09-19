import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,

      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async () => {
    try {
      await api.post("/auth/register", form);

      alert("Đăng ký thành công");

      navigate("/login");
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>✈️ Tạo tài khoản</h2>

        <input
          name="full_name"
          placeholder="Họ và tên"
          onChange={handleChange}
        />

        <input name="email" placeholder="Email" onChange={handleChange} />

        <input
          name="password"
          type="password"
          placeholder="Mật khẩu"
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Số điện thoại"
          onChange={handleChange}
        />

        <button onClick={handleRegister}>Đăng ký</button>

        <p>
          Đã có tài khoản?
          <span onClick={() => navigate("/login")}>Đăng nhập</span>
        </p>
      </div>
    </div>
  );
}

export default Register;
