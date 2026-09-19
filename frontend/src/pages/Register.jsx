import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import AuthLayout from "../components/AuthLayout";

const inputClass =
  "w-full px-5 py-4 rounded-xl border border-slate-200 bg-white text-slate-800 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition";

const labelClass = "block text-base font-medium text-slate-700 mb-2";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Chỉ mất 30 giây để bắt đầu hành trình"
      icon="🛫"
    >
      <div className="space-y-5">
        <div>
          <label className={labelClass}>Họ và tên</label>
          <input
            name="full_name"
            placeholder="Nguyễn Văn A"
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Mật khẩu</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Số điện thoại</label>
            <input
              name="phone"
              placeholder="0912 345 678"
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <button
          onClick={handleRegister}
          className="w-full py-4 rounded-xl bg-slate-900 text-white text-base font-semibold hover:bg-slate-800 active:scale-[0.99] transition shadow-sm"
        >
          Đăng ký
        </button>
      </div>

      <p className="text-center text-base text-slate-500 mt-7">
        Đã có tài khoản?{" "}
        <span
          onClick={() => navigate("/login")}
          className="text-sky-600 font-semibold hover:underline cursor-pointer"
        >
          Đăng nhập
        </span>
      </p>
    </AuthLayout>
  );
}

export default Register;
