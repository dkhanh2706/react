import { formatTime } from "../utils/format.js";
import { getStoredUser, clearAuthStorage } from "../utils/auth.js";
import { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AccountAvatar from "../components/common/AccountAvatar";
import AdminChatPresence from "../components/chat/AdminChatPresence";
import { AdminChatContext } from "../contexts/AdminChatContext";
import { stopAdminChat } from "../api/chatRealtime";
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
  MessageCircle,
} from "lucide-react";

import "../styles/admin/AdminLayout.css";

function AdminLayout({ children, pageTitle = "Dashboard" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const chat = useContext(AdminChatContext);
  const unread = chat.state.conversations.reduce((total, c) => total + c.unread, 0);

  const [currentTime, setCurrentTime] = useState("");

  // Live time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        formatTime(now, { seconds: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const user = getStoredUser();
  const adminName = user?.full_name || user?.name || "Administrator";
  const adminInitial = adminName.charAt(0).toUpperCase();

  const logout = async () => {
    await stopAdminChat();
    clearAuthStorage();
    toast.success("Đã đăng xuất khỏi hệ thống quản trị");
    navigate("/login");
  };

  const navItems = [
    { id: 'chat', title: `Chat hỗ trợ${unread ? ` (${unread})` : ''}`, path: '/admin/chat', icon: <MessageCircle size={19} />, active: location.pathname === '/admin/chat' },
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
      active: location.pathname === "/admin/bookings",
    },
    {
      id: "payments",
      title: "Quản lý thanh toán",
      path: "/admin/payments",
      icon: <CreditCard size={19} />,
      active: location.pathname === "/admin/payments",
    },
  ];

  return (
    <div className="admin-layout-root">
      {/* ================= SIDEBAR ================= */}
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
          <AdminChatPresence />
          <div>
            <p className="adm-nav-group-title">Điều khiển hệ thống</p>
            <div className="adm-nav-links">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`adm-nav-item ${item.active ? "active" : ""}`}
                  aria-label={item.title}
                  title={item.title}
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
            <div className="adm-avatar"><AccountAvatar url={user?.avatar_url} name={adminName} fallback={adminInitial} /></div>
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

      {/* ================= MAIN WRAPPER ================= */}
      <div className="adm-main-wrapper">
        {/* TOPBAR */}
        <header className="adm-topbar">
          <div className="adm-breadcrumb-area">
            <span className="adm-bc-root">Admin Hub</span>
            <span className="adm-bc-sep">/</span>
            <span className="adm-bc-current">{pageTitle}</span>
          </div>

          <div className="adm-topbar-right">
            <div className="adm-system-health">
              <span className="adm-pulse-dot" />
              <span className="adm-health-desktop">Hệ thống trực tuyến (Live)</span>
              <span className="adm-health-mobile">Trực tuyến</span>
            </div>

            <div className="adm-clock">{currentTime || "--:--:--"}</div>
          </div>
        </header>

        {/* VIEWPORT */}
        <div className="adm-content-viewport">{children}</div>
      </div>
    </div>
  );
}

export default AdminLayout;
