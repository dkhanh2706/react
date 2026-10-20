import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";
import api from "../api/axios";
import AuthLayout from "../components/AuthLayout";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // =====================================================
  // THAY ĐỔI DỮ LIỆU FORM
  // =====================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // KIỂM TRA HỌ TÊN
  // =====================================================
  const validateFullName = (fullName) => {
    const name = fullName.trim();

    if (!name) {
      return "Vui lòng nhập họ và tên";
    }

    if (name.length < 2) {
      return "Họ và tên phải có ít nhất 2 ký tự";
    }

    if (name.length > 100) {
      return "Họ và tên không được vượt quá 100 ký tự";
    }

    // Cho phép chữ tiếng Việt, khoảng trắng, dấu ', dấu chấm và dấu -
    const nameRegex = /^[\p{L}\s'.-]+$/u;

    if (!nameRegex.test(name)) {
      return "Họ và tên không được chứa số hoặc ký tự đặc biệt không hợp lệ";
    }

    return "";
  };

  // =====================================================
  // KIỂM TRA EMAIL
  // =====================================================
  const validateEmail = (emailValue) => {
    const email = emailValue.trim().toLowerCase();

    if (!email) {
      return "Vui lòng nhập email";
    }

    if (email.length > 150) {
      return "Email không được vượt quá 150 ký tự";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,24}$/;

    if (!emailRegex.test(email)) {
      return "Email không đúng định dạng";
    }

    // Bắt lỗi thường gặp mà thầy có thể test:
    // abc@gmail.con
    const commonWrongDomains = [
      "gmail.con",
      "gmai.com",
      "gmial.com",
      "gmail.co",
      "yahoo.con",
      "outlook.con",
    ];

    const domain = email.split("@")[1];

    if (commonWrongDomains.includes(domain)) {
      return "Tên miền email không hợp lệ";
    }

    return "";
  };

  // =====================================================
  // KIỂM TRA MẬT KHẨU
  // =====================================================
  const validatePassword = (password) => {
    if (!password) {
      return "Vui lòng nhập mật khẩu";
    }

    if (password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự";
    }

    if (new TextEncoder().encode(password).length > 72) {
      return "Mật khẩu không được vượt quá 72 byte (ký tự có dấu có thể chiếm nhiều byte)";
    }

    return "";
  };

  // =====================================================
  // KIỂM TRA SỐ ĐIỆN THOẠI
  // =====================================================
  const validatePhone = (phoneValue) => {
    const phone = phoneValue.trim();

    if (!phone) {
      return "Vui lòng nhập số điện thoại";
    }

    // 10 chữ số, bắt đầu bằng 0
    const phoneRegex = /^0\d{9}$/;

    if (!phoneRegex.test(phone)) {
      return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0";
    }

    return "";
  };

  // =====================================================
  // ĐĂNG KÝ
  // =====================================================
  const handleRegister = async () => {
    if (loading) {
      return;
    }

    // -------------------------
    // VALIDATE HỌ TÊN
    // -------------------------
    const fullNameError = validateFullName(form.full_name);

    if (fullNameError) {
      alert(fullNameError);
      return;
    }

    const emailError = validateEmail(form.email);

    if (emailError) {
      alert(emailError);
      return;
    }

    const passwordError = validatePassword(form.password);

    if (passwordError) {
      alert(passwordError);
      return;
    }

    const phoneError = validatePhone(form.phone);

    if (phoneError) {
      alert(phoneError);
      return;
    }

    try {
      setLoading(true);

      // Chuẩn hóa dữ liệu trước khi gửi server
      const registerData = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
      };

      const response = await api.post("/auth/register", registerData);

      alert(response.data?.message || "Đăng ký thành công");

      navigate("/login");
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      if (error.response) {
        alert(error.response.data?.message || "Đăng ký thất bại");
      } else {
        alert("Không kết nối được server");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      subtitle="Đăng ký tài khoản để bắt đầu trải nghiệm dịch vụ bay đẳng cấp"
      icon="🛫"
      badge="THÀNH VIÊN MỚI"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 sm:space-y-5">
        {/* HỌ VÀ TÊN */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Họ và tên
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors duration-200">
              <User className="w-5 h-5" />
            </div>
            <input
              name="full_name"
              type="text"
              placeholder="Nguyễn Văn A"
              value={form.full_name}
              onChange={handleChange}
              maxLength={101}
              autoComplete="name"
              disabled={loading}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-all duration-200 disabled:opacity-60 shadow-sm"
            />
          </div>
        </div>

        {/* EMAIL */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Địa chỉ Email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors duration-200">
              <Mail className="w-5 h-5" />
            </div>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              maxLength={151}
              autoComplete="email"
              disabled={loading}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-all duration-200 disabled:opacity-60 shadow-sm"
            />
          </div>
        </div>

        {/* MẬT KHẨU & SỐ ĐIỆN THOẠI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* PASSWORD */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Mật khẩu
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                ≥ 8 ký tự
              </span>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors duration-200">
                <Lock className="w-5 h-5" />
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                maxLength={101}
                autoComplete="new-password"
                disabled={loading}
                className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-all duration-200 disabled:opacity-60 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* PHONE */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Số điện thoại
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                10 số
              </span>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors duration-200">
                <Phone className="w-5 h-5" />
              </div>
              <input
                name="phone"
                type="text"
                inputMode="numeric"
                placeholder="0912345678"
                value={form.phone}
                onChange={handleChange}
                maxLength={20}
                autoComplete="tel"
                disabled={loading}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-all duration-200 disabled:opacity-60 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* NÚT ĐĂNG KÝ */}
        <button
          type="button"
          onClick={handleRegister}
          disabled={loading}
          className="relative w-full py-3.5 px-4 mt-2 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 active:scale-[0.985] text-white text-sm sm:text-base font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group cursor-pointer overflow-hidden"
        >
          {/* Subtle button shine effect */}
          <span className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang xử lý đăng ký...</span>
            </>
          ) : (
            <>
              <span>Đăng ký tài khoản</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>

      {/* ĐIỀU HƯỚNG SANG ĐĂNG NHẬP */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-sky-600 hover:text-sky-700 font-semibold hover:underline cursor-pointer inline-flex items-center gap-1 transition-colors"
          >
            <span>Đăng nhập ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Register;
