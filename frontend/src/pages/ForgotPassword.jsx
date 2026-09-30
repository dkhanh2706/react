import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../api/axios";
import AuthLayout from "../components/AuthLayout";

const inputClass =
  "w-full px-5 py-4 rounded-xl border border-slate-200 bg-white text-slate-800 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition";

const labelClass = "block text-base font-medium text-slate-700 mb-2";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const handleForgot = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auth/forgot-password", {
        email,
      });

      // Lưu email để qua trang reset lấy lại
      localStorage.setItem("resetEmail", email);

      toast.success("Đã gửi mã khôi phục");

      setTimeout(() => {
        navigate("/reset-password");
      }, 800);
    } catch (error) {
      console.log(error);

      if (error.response) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Không kết nối được server");
      }
    }
  };

  return (
    <AuthLayout
      title="Quên mật khẩu?"
      subtitle="Nhập email và chúng tôi sẽ gửi mã khôi phục cho bạn"
      icon="🔑"
    >
      <form onSubmit={handleForgot} className="space-y-5">
        <div>
          <label className={labelClass}>Email</label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-xl bg-slate-900 text-white text-base font-semibold hover:bg-slate-800 active:scale-[0.99] transition shadow-sm"
        >
          Gửi mã khôi phục
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

export default ForgotPassword;
