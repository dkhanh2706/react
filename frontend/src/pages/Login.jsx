import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import AuthLayout from "../components/AuthLayout";

const inputClass =
  "w-full px-5 py-4 rounded-xl border border-slate-200 bg-white text-slate-800 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition";

const labelClass = "block text-base font-medium text-slate-700 mb-2";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      alert("Đăng nhập thành công");
      navigate("/home");
    } catch (error) {
      console.log(error);
      if (error.response) alert(error.response.data.message);
      else alert("Không kết nối được server");
    }
  };

  return (
    <AuthLayout
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục đặt vé"
    >
      <form onSubmit={handleLogin} className="space-y-5">
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

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-base font-medium text-slate-700">
              Mật khẩu
            </label>
            <span
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-sky-600 hover:text-sky-700 font-medium hover:underline cursor-pointer"
            >
              Quên mật khẩu?
            </span>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-xl bg-slate-900 text-white text-base font-semibold hover:bg-slate-800 active:scale-[0.99] transition shadow-sm"
        >
          Đăng nhập
        </button>
      </form>

      <div className="flex items-center gap-3 my-7">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-sm text-slate-400">hoặc</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <button
        onClick={() => navigate("/register")}
        className="w-full py-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-base font-medium hover:bg-slate-50 transition"
      >
        Tạo tài khoản mới
      </button>

      <p className="text-center text-sm text-slate-400 mt-8">
        Bằng việc đăng nhập, bạn đồng ý với{" "}
        <span className="text-sky-600 hover:underline cursor-pointer">
          Điều khoản
        </span>{" "}
        &{" "}
        <span className="text-sky-600 hover:underline cursor-pointer">
          Chính sách
        </span>
      </p>
    </AuthLayout>
  );
}

export default Login;
