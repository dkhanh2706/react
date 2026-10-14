import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  Loader2,
} from "lucide-react";

import api from "../api/axios";
import AuthLayout from "../components/AuthLayout";

const ADMIN_EMAIL = "adminhdk@gmail.com";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const token = response.data.token;
      const user = response.data.user;

      if (!token || !user) {
        toast.error("Dữ liệu đăng nhập không hợp lệ");
        setIsSubmitting(false);
        return;
      }

      // =============================
      // LƯU THÔNG TIN ĐĂNG NHẬP
      // =============================
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Đăng nhập thành công");

      // =============================
      // KIỂM TRA ADMIN
      // =============================
      const isAdmin =
        user?.role === "ADMIN" ||
        user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      // =============================
      // CHUYỂN TRANG
      // =============================
      setTimeout(() => {
        if (isAdmin) {
          navigate("/admin", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
      }, 500);
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      setIsSubmitting(false);

      if (error.response) {
        toast.error(error.response.data?.message || "Đăng nhập thất bại");
      } else {
        toast.error("Không kết nối được server");
      }
    }
  };

  return (
    <AuthLayout
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để khám phá các hành trình và quản lý vé của bạn"
      icon="✈️"
      badge="DAMH SHOP"
      maxWidth="max-w-[460px]"
    >
      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Địa chỉ Email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors duration-200">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-all duration-200 disabled:opacity-60 shadow-sm"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-slate-700">
              Mật khẩu
            </label>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline transition-colors cursor-pointer"
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors duration-200">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-all duration-200 disabled:opacity-60 shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="relative w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 active:scale-[0.985] text-white text-sm sm:text-base font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group cursor-pointer overflow-hidden"
        >
          {/* Subtle button shine effect */}
          <span className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="border-t border-slate-200 w-full" />
        <span className="bg-white px-3 text-xs uppercase tracking-wider text-slate-400 font-semibold absolute">
          hoặc
        </span>
      </div>

      {/* Register CTA Button */}
      <button
        type="button"
        onClick={() => navigate("/register")}
        className="w-full py-3.5 px-4 rounded-xl border border-slate-200 hover:border-sky-300 bg-white hover:bg-sky-50/50 text-slate-700 hover:text-sky-700 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.985] cursor-pointer group"
      >
        <UserPlus className="w-4 h-4 text-slate-500 group-hover:text-sky-600 transition-colors" />
        <span>Chưa có tài khoản? Tạo tài khoản mới</span>
      </button>
    </AuthLayout>
  );
}

export default Login;
