function AuthLayout({
  children,
  title,
  subtitle,
  icon = "✈️",
  badge = "AIRLINE",
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-100 via-sky-50 to-slate-100 relative overflow-hidden">
      {/* Hoạ tiết nền mờ */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-10 text-6xl opacity-10 select-none">
        ✈️
      </div>
      <div className="absolute bottom-1/4 left-10 text-5xl opacity-10 select-none">
        🛫
      </div>

      {/* Card duy nhất */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-12">
        {/* Logo + badge */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg mb-4">
            {icon}
          </div>

          <span className="inline-block px-3 py-1 text-[11px] font-semibold tracking-widest text-sky-700 bg-sky-50 border border-sky-100 rounded-full mb-4">
            {badge}
          </span>

          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-slate-500 mt-3 text-base">{subtitle}</p>
          )}
        </div>

        {/* Nội dung form */}
        {children}
      </div>

      {/* Footer ngoài card */}
      <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-slate-400">
        © 2025 Airline Booking · Bay cùng chúng tôi
      </p>
    </div>
  );
}

export default AuthLayout;
