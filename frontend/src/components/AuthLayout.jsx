function AuthLayout({
  children,
  title,
  subtitle,
  icon = "✈️",
  badge = "AIRLINE",
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-br from-sky-100 via-white to-blue-100">
      {/* Keyframes riêng cho trang đăng nhập / đăng ký (không phụ thuộc home.css) */}
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&display=swap");

        .auth-title {
          font-family: "Bricolage Grotesque", "Be Vietnam Pro", system-ui, sans-serif;
          letter-spacing: -0.02em;
        }

        @keyframes authCardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes authItemIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes authFloat {
          0%, 100% { transform: translateY(0) rotate(-8deg); }
          50%      { transform: translateY(-14px) rotate(-3deg); }
        }
        @keyframes authDrift {
          0%, 100% { transform: translate(0, 0); }
          50%      { transform: translate(36px, 24px); }
        }

        .auth-card  { animation: authCardIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .auth-item  { animation: authItemIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .auth-float { animation: authFloat 7s ease-in-out infinite; }
        .auth-drift { animation: authDrift 16s ease-in-out infinite; }
        .auth-drift-2 { animation-duration: 20s; animation-direction: reverse; }

        @media (prefers-reduced-motion: reduce) {
          .auth-card, .auth-item, .auth-float, .auth-drift { animation: none; }
        }
      `}</style>

      {/* Hoạ tiết nền mờ */}
      <div className="auth-drift absolute -top-24 -left-24 w-96 h-96 bg-sky-300/40 rounded-full blur-3xl" />
      <div className="auth-drift auth-drift-2 absolute -bottom-24 -right-24 w-96 h-96 bg-blue-300/40 rounded-full blur-3xl" />
      <div className="auth-float absolute top-1/4 right-10 text-6xl opacity-15 select-none">
        ✈️
      </div>
      <div
        className="auth-float absolute bottom-1/4 left-10 text-5xl opacity-15 select-none"
        style={{ animationDelay: "-3s" }}
      >
        🛫
      </div>

      {/* Card duy nhất */}
      <div className="auth-card relative z-10 w-full max-w-2xl bg-white/90 backdrop-blur rounded-3xl shadow-[0_30px_60px_-24px_rgba(7,27,58,0.35)] border border-slate-100 p-8 sm:p-12">
        {/* Logo + badge */}
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="auth-item w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-sky-500 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30 mb-4"
            style={{ animationDelay: "0.1s" }}
          >
            {icon}
          </div>

          <span
            className="auth-item inline-block px-3 py-1 text-[11px] font-semibold tracking-widest text-blue-700 bg-blue-50 border border-blue-100 rounded-full mb-4"
            style={{ animationDelay: "0.18s" }}
          >
            {badge}
          </span>

          <h2
            className="auth-item auth-title text-3xl sm:text-4xl font-extrabold text-slate-900"
            style={{ animationDelay: "0.26s" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="auth-item text-slate-500 mt-3 text-base"
              style={{ animationDelay: "0.34s" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Nội dung form */}
        {children}
      </div>

      {/* Footer ngoài card */}
      <p className="relative z-10 mt-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Airline Booking · Bay cùng chúng tôi
      </p>
    </div>
  );
}

export default AuthLayout;
