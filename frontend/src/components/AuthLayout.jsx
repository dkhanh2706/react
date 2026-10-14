import { ShieldCheck } from "lucide-react";

function AuthLayout({
  children,
  title,
  subtitle,
  icon = "✈️",
  badge = "DAMH SHOP",
  maxWidth = "max-w-[480px]",
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50/70 to-blue-100/60 select-text">
      {/* CSS Animations & Custom Effects */}
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

        .auth-font-root {
          font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
        }

        @keyframes authFadeInUp {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes authPulseGlow {
          0%, 100% {
            opacity: 0.35;
            transform: scale(1);
          }
          50% {
            opacity: 0.65;
            transform: scale(1.08);
          }
        }

        @keyframes flightDash {
          to {
            stroke-dashoffset: -40;
          }
        }

        .auth-card-motion {
          animation: authFadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .auth-pulse-orb {
          animation: authPulseGlow 8s ease-in-out infinite alternate;
        }

        .flight-line {
          stroke-dasharray: 6 6;
          animation: flightDash 2.5s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-card-motion,
          .auth-pulse-orb,
          .flight-line {
            animation: none !important;
          }
        }
      `}</style>

      {/* Ambient Gradient Glow Orbs */}
      <div
        aria-hidden="true"
        className="auth-pulse-orb pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-sky-400/30 to-blue-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="auth-pulse-orb pointer-events-none absolute -bottom-36 -right-32 w-[30rem] h-[30rem] rounded-full bg-gradient-to-tl from-blue-500/25 via-indigo-400/20 to-sky-300/20 blur-3xl"
        style={{ animationDelay: "-3s" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[48rem] h-[48rem] rounded-full bg-sky-200/20 blur-[120px]"
      />

      {/* Decorative Flight Path Lines (SVG) */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full opacity-35"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M -100 250 Q 300 80 800 320 T 1700 120"
          fill="none"
          stroke="url(#skyGradient1)"
          strokeWidth="1.5"
          className="flight-line"
        />
        <path
          d="M 100 800 Q 600 650 1100 850 T 2000 600"
          fill="none"
          stroke="url(#skyGradient2)"
          strokeWidth="1.5"
          className="flight-line"
          style={{ animationDirection: "reverse", animationDuration: "3.5s" }}
        />
        <defs>
          <linearGradient id="skyGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="skyGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Main Glassmorphism Card */}
      <div
        className={`auth-font-root auth-card-motion relative z-10 w-full ${maxWidth} bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(14,65,134,0.18),0_1px_3px_rgba(0,0,0,0.04)] border border-white/90 p-6 sm:p-9 my-auto flex flex-col transition-all duration-300`}
      >
        {/* Subtle Top Glowing Line Accent */}
        <div className="absolute inset-x-8 top-0 h-[2.5px] bg-gradient-to-r from-transparent via-sky-500 to-transparent rounded-full opacity-80" />

        {/* Card Header (Icon, Badge, Title, Subtitle) */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* Animated Icon Avatar */}
          <div className="relative mb-3 group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-600 opacity-40 blur-md group-hover:opacity-60 transition duration-500" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 flex items-center justify-center text-2xl shadow-xl shadow-blue-500/25 border border-white/30 text-white transform transition-transform duration-300 group-hover:scale-105 group-hover:rotate-2">
              {typeof icon === "string" ? (
                <span className="select-none leading-none">{icon}</span>
              ) : (
                icon
              )}
            </div>
          </div>

          {/* Badge Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase text-sky-700 bg-sky-50 border border-sky-100 shadow-sm mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            {badge}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-slate-500 text-sm mt-1.5 max-w-sm">{subtitle}</p>
          )}
        </div>

        {/* Form Content / Children */}
        <div className="w-full flex flex-col">{children}</div>
      </div>

      {/* Security & Copyright Footer */}
      <div className="relative z-10 mt-5 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>Bảo mật chuẩn mã hoá SSL 256-bit</span>
        </div>
        <span className="hidden sm:inline text-slate-300">•</span>
        <span>
          © {new Date().getFullYear()} DAMH Shop · Bay cùng chúng tôi
        </span>
      </div>
    </div>
  );
}

export default AuthLayout;
