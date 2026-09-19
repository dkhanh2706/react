import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import AuthLayout from "../components/AuthLayout";

const inputClass =
  "w-full px-5 py-4 rounded-xl border border-slate-200 bg-white text-slate-800 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition";

const labelClass = "block text-base font-medium text-slate-700 mb-2";

function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: localStorage.getItem("resetEmail") || "",
    code: "",
    newPassword: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/reset-password", form);
      alert(response.data.message);
      localStorage.removeItem("resetEmail");
      navigate("/login");
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Nhập mã xác nhận và mật khẩu mới của bạn"
      icon="🔐"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Email</label>
          <input
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Mã xác nhận</label>
          <input
            name="code"
            placeholder="Nhập mã 6 số"
            value={form.code}
            onChange={handleChange}
            className={`${inputClass} tracking-[0.5em] text-center font-mono`}
          />
        </div>

        <div>
          <label className={labelClass}>Mật khẩu mới</label>
          <input
            name="newPassword"
            type="password"
            placeholder="••••••••"
            value={form.newPassword}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-xl bg-slate-900 text-white text-base font-semibold hover:bg-slate-800 active:scale-[0.99] transition shadow-sm"
        >
          Xác nhận đổi mật khẩu
        </button>
      </form>

      <p className="text-center text-base text-slate-500 mt-7">
        <span
          onClick={() => navigate("/login")}
          className="hover:text-sky-600 hover:underline cursor-pointer"
        >
          ← Quay lại đăng nhập
        </span>
      </p>
    </AuthLayout>
  );
}

export default ResetPassword;
