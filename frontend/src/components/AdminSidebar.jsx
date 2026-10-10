import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Plane,
  Users,
  TicketCheck,
  CreditCard,
  LogOut,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import "../styles/admin/AdminLayout.css";

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  };

  const user = getUser();
  const adminName = user?.full_name || user?.name || "Administrator";
  const adminInitial = adminName.charAt(0).toUpperCase();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Đã đăng xuất khỏi hệ thống quản trị");
    navigate("/login");
  };

  const navItems = [
    {
      id: "dashboard",
      title: "Tổng quan Dashboard",
      path: "/admin",
      icon: <LayoutDashboard size={19} />,
      active: location.pathname === "/admin",
    },
    {
      id: "flights",
      title: "Quản lý chuyến bay",
      path: "/admin/flights",
      icon: <Plane size={19} />,
      active: location.pathname === "/admin/flights",
    },
    {
      id: "users",
      title: "Quản lý tài khoản",
      path: "/admin/users",
      icon: <Users size={19} />,
      active: location.pathname === "/admin/users",
    },
    {
      id: "bookings",
      title: "Quản lý đặt vé",
      path: "/admin/bookings",
      icon: <TicketCheck size={19} />,
      soon: true,
      onClick: () => toast("Chức năng Quản lý đặt vé đang hoàn thiện"),
    },
    {
      id: "payments",
      title: "Quản lý thanh toán",
      path: "/admin/payments",
      icon: <CreditCard size={19} />,
      soon: true,
      onClick: () => toast("Chức năng Quản lý thanh toán đang hoàn thiện"),
    },
  ];

  return (
    <aside className="adm-sidebar">
      {/* BRAND */}
      <div className="adm-sidebar-header">
        <button
          type="button"
          className="adm-brand-link"
          onClick={() => navigate("/admin")}
        >
          <div className="adm-brand-icon-box">✈</div>
          <div className="adm-brand-title">
            <span className="adm-brand-name">AirAdmin</span>
            <span className="adm-brand-tagline">Command Hub</span>
          </div>
        </button>
      </div>

      {/* NAVIGATION */}
      <div className="adm-sidebar-body">
        <div>
          <p className="adm-nav-group-title">Điều khiển hệ thống</p>
          <div className="adm-nav-links">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`adm-nav-item ${item.active ? "active" : ""}`}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else {
                    navigate(item.path);
                  }
                }}
              >
                <div className="adm-nav-left">
                  <span className="adm-nav-icon">{item.icon}</span>
                  <span>{item.title}</span>
                </div>
                {item.soon ? (
                  <span className="adm-badge-soon">Soon</span>
                ) : (
                  item.active && <ChevronRight size={16} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="adm-nav-group-title">Tiện ích nhanh</p>
          <button
            type="button"
            className="adm-btn-customer-view"
            onClick={() => navigate("/home")}
          >
            <ExternalLink size={15} />
            <span>Xem trang khách hàng</span>
          </button>
        </div>
      </div>

      {/* SIDEBAR FOOTER */}
      <div className="adm-sidebar-footer">
        <div className="adm-user-profile-box">
          <div className="adm-avatar">{adminInitial}</div>
          <div className="adm-user-info">
            <span className="adm-user-name">{adminName}</span>
            <span className="adm-user-role-badge">
              <ShieldCheck size={11} style={{ display: "inline", marginRight: 3 }} />
              Quản trị viên
            </span>
          </div>
        </div>

        <button type="button" className="adm-btn-logout" onClick={logout}>
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
