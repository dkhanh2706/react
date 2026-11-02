import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import AuthLayout from "../layouts/AuthLayout";
import { vietnamToday } from "../utils/format.js";
import { validateRegistration } from "../utils/registration.js";

const inputClass = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:opacity-60";

function RegisterField({ label, name, error, children }) {
  return <div>
    <label htmlFor={`register-${name}`} className="mb-1.5 block text-sm font-semibold text-slate-700">{label} <span className="text-red-600">*</span></label>
    {children}
    {error && <p id={`error-${name}`} className="mt-1 text-sm text-red-700" role="alert">{error}</p>}
  </div>;
}

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", birth_date: "", gender: "", password: "", confirm_password: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleChange = ({ target: { name, value } }) => {
    setForm(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: undefined, ...(name === "password" ? { confirm_password: undefined } : {}) }));
    setSubmitError("");
  };
  const fieldProps = name => ({
    id: `register-${name}`, name, value: form[name], onChange: handleChange,
    required: true, disabled: loading, className: inputClass,
    "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `error-${name}` : undefined,
  });
  const handleRegister = async event => {
    event.preventDefault();
    if (loading) return;
    const nextErrors = validateRegistration(form);
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length) {
      document.getElementById(`register-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        ...form, full_name: form.full_name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(),
      });
      toast.success(data.message || "Đăng ký thành công");
      navigate("/login", { state: { from: location.state?.from } });
    } catch (error) {
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors && Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
        document.getElementById(`register-${Object.keys(fieldErrors)[0]}`)?.focus();
      } else setSubmitError(error.response?.data?.message || "Không kết nối được server. Vui lòng thử lại.");
    } finally { setLoading(false); }
  };
  return <AuthLayout title="Tạo tài khoản mới" subtitle="Hoàn tất thông tin cá nhân để thuận tiện khi đặt vé" icon="🛫" badge="THÀNH VIÊN MỚI" maxWidth="max-w-2xl">
    <form onSubmit={handleRegister} noValidate className="space-y-4">
      <p className="text-sm text-slate-500">Các trường có dấu <span className="text-red-600">*</span> là bắt buộc.</p>
      <RegisterField name="full_name" label="Họ và tên" error={errors.full_name}>
        <input {...fieldProps("full_name")} autoComplete="name" maxLength={100} placeholder="Nguyễn Văn A" />
      </RegisterField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RegisterField name="email" label="Địa chỉ Email" error={errors.email}>
          <input {...fieldProps("email")} type="email" autoComplete="email" maxLength={150} placeholder="you@example.com" />
        </RegisterField>
        <RegisterField name="phone" label="Số điện thoại" error={errors.phone}>
          <input {...fieldProps("phone")} type="tel" autoComplete="tel" maxLength={20} placeholder="0912345678" />
        </RegisterField>
        <RegisterField name="birth_date" label="Ngày sinh" error={errors.birth_date}>
          <input {...fieldProps("birth_date")} type="date" autoComplete="bday" max={vietnamToday()} />
        </RegisterField>
        <RegisterField name="gender" label="Giới tính" error={errors.gender}>
          <select {...fieldProps("gender")}><option value="">Chọn giới tính</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option></select>
        </RegisterField>
        <RegisterField name="password" label="Mật khẩu" error={errors.password}>
          <input {...fieldProps("password")} type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Ít nhất 8 ký tự" />
        </RegisterField>
        <RegisterField name="confirm_password" label="Xác nhận mật khẩu" error={errors.confirm_password}>
          <input {...fieldProps("confirm_password")} type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Nhập lại mật khẩu" />
        </RegisterField>
      </div>
      <button type="button" onClick={() => setShowPassword(value => !value)} className="flex items-center gap-2 text-sm font-medium text-sky-700" aria-pressed={showPassword}>
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}{showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      </button>
      {submitError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
      <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-3.5 font-semibold text-white disabled:opacity-60">
        {loading ? <><Loader2 size={18} className="animate-spin" />Đang xử lý đăng ký...</> : <>Đăng ký tài khoản<ArrowRight size={18} /></>}
      </button>
    </form>
    <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">Đã có tài khoản? <button type="button" onClick={() => navigate("/login", { state: { from: location.state?.from } })} className="font-semibold text-sky-700 hover:underline">Đăng nhập ngay</button></p>
  </AuthLayout>;
}
