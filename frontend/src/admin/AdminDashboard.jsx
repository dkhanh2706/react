import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  Users,
  Plane,
  TicketCheck,
  CreditCard,
  LogOut,
  ArrowRight,
  LayoutDashboard,
  ShieldCheck,
  Bell,
  ChevronRight,
  CircleCheck,
  Settings,
  HelpCircle,
  Sparkles,
  Activity,
} from "lucide-react";

import "../styles/admin/AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  };

  const user = getUser();

  const adminName = user?.full_name || "Administrator";
  const adminInitial = adminName.charAt(0).toUpperCase();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    toast.success("Đã đăng xuất");

    navigate("/login");
  };

  // =====================================================
  // CHỈ CẦN SỬA PATH + ENABLED Ở ĐÂY KHI LÀM THÊM TRANG
  // =====================================================
  const managementItems = [
    {
      id: 1,
      icon: <Users size={27} />,
      title: "Quản lý tài khoản",
      shortTitle: "Tài khoản",
      description:
        "Xem danh sách người dùng, kiểm tra thông tin và quản lý tài khoản trong hệ thống.",
      path: "/admin/users",
      enabled: true,
      className: "users",
    },
    {
      id: 2,
      icon: <Plane size={27} />,
      title: "Quản lý chuyến bay",
      shortTitle: "Chuyến bay",
      description:
        "Thêm mới, chỉnh sửa và quản lý thông tin các chuyến bay trong hệ thống.",
      path: "/admin/flights",
      enabled: true,
      className: "flights",
    },
    {
      id: 3,
      icon: <TicketCheck size={27} />,
      title: "Quản lý đặt vé",
      shortTitle: "Đặt vé",
      description:
        "Theo dõi và kiểm tra các đơn đặt vé của khách hàng trên hệ thống.",
      path: "/admin/bookings",
      enabled: false,
      className: "bookings",
    },
    {
      id: 4,
      icon: <CreditCard size={27} />,
      title: "Quản lý thanh toán",
      shortTitle: "Thanh toán",
      description:
        "Theo dõi trạng thái thanh toán và các giao dịch đặt vé của khách hàng.",
      path: "/admin/payments",
      enabled: false,
      className: "payments",
    },
  ];

  const handleNavigate = (item) => {
    if (!item.enabled) {
      toast("Chức năng này đang được phát triển");
      return;
    }

    navigate(item.path);
  };

  return (
    <div className="admin-dashboard">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <aside className="admin-sidebar">
        {/* LOGO */}
        <div className="admin-sidebar-header">
          <button
            className="admin-brand"
            type="button"
            onClick={() => navigate("/admin")}
          >
            <div className="admin-brand-icon">
              <Plane size={25} />
            </div>

            <div className="admin-brand-text">
              <strong>AirAdmin</strong>
              <span>Management System</span>
            </div>
          </button>
        </div>

        {/* MENU */}
        <div className="admin-sidebar-body">
          <div className="admin-sidebar-section">
            <p className="admin-sidebar-label">QUẢN TRỊ</p>

            <button
              className="admin-nav-item active"
              type="button"
              onClick={() => navigate("/admin")}
            >
              <span className="admin-nav-icon">
                <LayoutDashboard size={21} />
              </span>

              <span className="admin-nav-text">Tổng quan</span>
            </button>

            {managementItems.map((item) => (
              <button
                key={item.id}
                className={`admin-nav-item ${!item.enabled ? "coming" : ""}`}
                type="button"
                onClick={() => handleNavigate(item)}
              >
                <span className="admin-nav-icon">{item.icon}</span>

                <span className="admin-nav-text">{item.shortTitle}</span>

                {item.enabled ? (
                  <ChevronRight className="admin-nav-arrow" size={18} />
                ) : (
                  <span className="admin-nav-badge">Soon</span>
                )}
              </button>
            ))}
          </div>

          <div className="admin-sidebar-section">
            <p className="admin-sidebar-label">HỆ THỐNG</p>

            <button
              className="admin-nav-item coming"
              type="button"
              onClick={() => toast("Chức năng cài đặt đang được phát triển")}
            >
              <span className="admin-nav-icon">
                <Settings size={21} />
              </span>

              <span className="admin-nav-text">Cài đặt</span>
            </button>

            <button
              className="admin-nav-item coming"
              type="button"
              onClick={() => toast("Chức năng trợ giúp đang được phát triển")}
            >
              <span className="admin-nav-icon">
                <HelpCircle size={21} />
              </span>

              <span className="admin-nav-text">Trợ giúp</span>
            </button>
          </div>
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-profile">
            <div className="admin-sidebar-avatar">{adminInitial}</div>

            <div className="admin-sidebar-profile-info">
              <strong>{adminName}</strong>
              <span>Quản trị viên</span>
            </div>

            <ShieldCheck size={19} className="admin-sidebar-shield" />
          </div>

          <button
            className="admin-logout-button"
            type="button"
            onClick={logout}
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}
      <main className="admin-main">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="admin-page-title">
            <div className="admin-page-breadcrumb">
              <span>Admin</span>

              <ChevronRight size={15} />

              <strong>Tổng quan</strong>
            </div>

            <h1>Dashboard</h1>
          </div>

          <div className="admin-topbar-actions">
            <button
              className="admin-icon-button"
              type="button"
              title="Thông báo"
            >
              <Bell size={21} />
              <span className="admin-notification-dot"></span>
            </button>

            <div className="admin-topbar-divider"></div>

            <div className="admin-topbar-profile">
              <div className="admin-topbar-avatar">{adminInitial}</div>

              <div className="admin-topbar-profile-text">
                <strong>{adminName}</strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* =====================================================
            CONTENT
        ===================================================== */}
        <div className="admin-content">
          {/* HERO */}
          <section className="admin-hero">
            {/* WELCOME */}
            <div className="admin-hero-content">
              <div className="admin-hero-tag">
                <Sparkles size={17} />

                <span>ADMIN CONTROL CENTER</span>
              </div>

              <h2>
                Chào mừng trở lại,
                <span> {adminName}!</span>
              </h2>

              <p>
                Quản lý tài khoản, chuyến bay và theo dõi các hoạt động quan
                trọng của hệ thống đặt vé máy bay tại một nơi.
              </p>

              <div className="admin-hero-actions">
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => navigate("/admin/flights")}
                >
                  <Plane size={19} />
                  <span>Quản lý chuyến bay</span>
                </button>

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => navigate("/admin/users")}
                >
                  <Users size={19} />
                  <span>Quản lý tài khoản</span>
                </button>
              </div>
            </div>

            {/* STATUS */}
            <div className="admin-hero-status">
              <div className="admin-status-top">
                <div className="admin-status-icon">
                  <Activity size={25} />
                </div>

                <div>
                  <span className="admin-status-label">
                    TRẠNG THÁI HỆ THỐNG
                  </span>

                  <strong>Hoạt động bình thường</strong>
                </div>
              </div>

              <div className="admin-status-divider"></div>

              <div className="admin-status-bottom">
                <div className="admin-server-info">
                  <span>Server</span>
                  <strong>Online</strong>
                </div>

                <div className="admin-online-badge">
                  <span className="admin-online-dot"></span>
                  <span>Stable</span>
                </div>
              </div>

              <div className="admin-status-plane">
                <Plane size={110} />
              </div>
            </div>
          </section>

          {/* =====================================================
              MANAGEMENT
          ===================================================== */}
          <section className="admin-management-section">
            <div className="admin-section-title">
              <div>
                <span className="admin-section-eyebrow">QUẢN TRỊ HỆ THỐNG</span>

                <h2>Các chức năng quản lý</h2>

                <p>Chọn chức năng bên dưới để bắt đầu quản lý dữ liệu.</p>
              </div>

              <div className="admin-system-live">
                <span className="admin-live-dot"></span>

                <div>
                  <strong>System Online</strong>
                  <span>Hoạt động ổn định</span>
                </div>
              </div>
            </div>

            <div className="admin-management-grid">
              {managementItems.map((item) => (
                <article
                  key={item.id}
                  className={`admin-feature-card ${
                    item.className
                  } ${!item.enabled ? "upcoming" : ""}`}
                >
                  <div className="admin-feature-card-header">
                    <div className={`admin-feature-icon ${item.className}`}>
                      {item.icon}
                    </div>

                    {item.enabled ? (
                      <div className="admin-feature-status">
                        <CircleCheck size={16} />
                        <span>Hoạt động</span>
                      </div>
                    ) : (
                      <div className="admin-feature-status soon">
                        <Sparkles size={15} />
                        <span>Sắp có</span>
                      </div>
                    )}
                  </div>

                  <div className="admin-feature-card-content">
                    <span className="admin-feature-number">0{item.id}</span>

                    <h3>{item.title}</h3>

                    <p>{item.description}</p>
                  </div>

                  <button
                    type="button"
                    className={`admin-feature-button ${
                      !item.enabled ? "upcoming-button" : ""
                    }`}
                    onClick={() => handleNavigate(item)}
                  >
                    <span>
                      {item.enabled ? "Truy cập quản lý" : "Xem chức năng"}
                    </span>

                    <span className="admin-feature-button-icon">
                      <ArrowRight size={19} />
                    </span>
                  </button>
                </article>
              ))}
            </div>
          </section>

          {/* NOTICE */}
          <section className="admin-notice">
            <div className="admin-notice-icon">
              <ShieldCheck size={24} />
            </div>

            <div className="admin-notice-content">
              <strong>Lưu ý dành cho quản trị viên</strong>

              <p>
                Các thao tác chỉnh sửa hoặc xóa dữ liệu có thể ảnh hưởng trực
                tiếp tới hệ thống. Hãy kiểm tra kỹ thông tin trước khi thực
                hiện.
              </p>
            </div>

            <div className="admin-notice-status">
              <span></span>
              <strong>Bảo mật</strong>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
