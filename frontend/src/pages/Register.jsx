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

  const [loading, setLoading] = useState(false);

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

    if (password.length > 100) {
      return "Mật khẩu không được vượt quá 100 ký tự";
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
      title="Tạo tài khoản"
      subtitle="Chỉ mất 30 giây để bắt đầu hành trình"
      icon="🛫"
    >
      <div className="space-y-5">
        {/* HỌ TÊN */}
        <div>
          <label className={labelClass}>Họ và tên</label>

          <input
            name="full_name"
            type="text"
            placeholder="Nguyễn Văn A"
            value={form.full_name}
            onChange={handleChange}
            maxLength={101}
            autoComplete="name"
            className={inputClass}
          />
        </div>

        {/* EMAIL */}
        <div>
          <label className={labelClass}>Email</label>

          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            maxLength={151}
            autoComplete="email"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* PASSWORD */}
          <div>
            <label className={labelClass}>Mật khẩu</label>

            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              maxLength={101}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>

          {/* PHONE */}
          <div>
            <label className={labelClass}>Số điện thoại</label>

            <input
              name="phone"
              type="text"
              inputMode="numeric"
              placeholder="0912345678"
              value={form.phone}
              onChange={handleChange}
              maxLength={20}
              autoComplete="tel"
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-slate-900 text-white text-base font-semibold hover:bg-slate-800 active:scale-[0.99] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Đang đăng ký..." : "Đăng ký"}
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
