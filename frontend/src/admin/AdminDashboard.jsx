import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plane,
  Users,
  CreditCard,
  PlusCircle,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Compass,
  Calendar,
  Sparkles,
  Search,
} from "lucide-react";

import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin/AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [flightCount, setFlightCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [recentFlights, setRecentFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  };

  const user = getUser();
  const adminName = user?.full_name || user?.name || "Administrator";

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch flights and users in parallel
        const [flightsRes, usersRes] = await Promise.allSettled([
          api.get("/flights", config),
          api.get("/users", config),
        ]);

        if (flightsRes.status === "fulfilled") {
          const list = flightsRes.value.data?.data || flightsRes.value.data || [];
          setFlightCount(Array.isArray(list) ? list.length : 0);
          setRecentFlights(Array.isArray(list) ? list.slice(0, 5) : []);
        }

        if (usersRes.status === "fulfilled") {
          const uList = usersRes.value.data || [];
          setUserCount(Array.isArray(uList) ? uList.length : 0);
        }
      } catch (err) {
        console.error("Dashboard overview error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  return (
    <AdminLayout pageTitle="Tổng quan Dashboard">
      <div className="adm-dashboard-page">
        {/* ================= HERO BANNER ================= */}
        <section className="adm-hero-banner">
          <div className="adm-hero-info">
            <div className="adm-hero-badge">
              <Sparkles size={14} />
              <span>Aviation Command System</span>
            </div>
            <h1>
              Chào mừng trở lại, <span>{adminName}</span>
            </h1>
            <p>
              Hệ thống radar quản lý hàng không đang vận hành ổn định. Dưới đây là thông số và hoạt động mới nhất trên hệ thống.
            </p>

            <div className="adm-hero-quick-actions">
              <button
                type="button"
                className="btn-adm-primary"
                onClick={() => navigate("/admin/flights")}
              >
                <PlusCircle size={18} />
                <span>Thêm chuyến bay mới</span>
              </button>

              <button
                type="button"
                className="btn-adm-secondary"
                onClick={() => navigate("/admin/users")}
              >
                <Users size={18} />
                <span>Quản lý thành viên</span>
              </button>
            </div>
          </div>

          <div className="adm-hero-graphic">
            <div className="radar-circle">
              <div className="radar-sweep" />
              <div className="radar-dot dot-1" />
              <div className="radar-dot dot-2" />
              <div className="radar-plane-center">✈</div>
            </div>
            <span className="radar-status-caption">RADAR TRẠNG THÁI KHÔNG LƯU</span>
          </div>
        </section>

        {/* ================= KPI STATS CARDS ================= */}
        <section className="adm-kpi-grid">
          {/* FLIGHTS */}
          <div className="kpi-card" onClick={() => navigate("/admin/flights")}>
            <div className="kpi-card-top">
              <div className="kpi-icon-box blue">
                <Plane size={24} />
              </div>
              <span className="kpi-trend positive">
                <ArrowUpRight size={14} /> Hoạt động
              </span>
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Tổng chuyến bay</span>
              <strong className="kpi-number">{loading ? "..." : flightCount}</strong>
              <small className="kpi-desc">Chuyến bay trên lịch trình</small>
            </div>
          </div>

          {/* USERS */}
          <div className="kpi-card" onClick={() => navigate("/admin/users")}>
            <div className="kpi-card-top">
              <div className="kpi-icon-box purple">
                <Users size={24} />
              </div>
              <span className="kpi-trend positive">
                <ArrowUpRight size={14} /> +8.5%
              </span>
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Tài khoản thành viên</span>
              <strong className="kpi-number">{loading ? "..." : userCount}</strong>
              <small className="kpi-desc">Khách hàng & Quản trị viên</small>
            </div>
          </div>

          {/* REVENUE ESTIMATE */}
          <div className="kpi-card">
            <div className="kpi-card-top">
              <div className="kpi-icon-box green">
                <CreditCard size={24} />
              </div>
              <span className="kpi-trend positive">
                <ArrowUpRight size={14} /> Tích cực
              </span>
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Ước tính doanh số</span>
              <strong className="kpi-number">
                {loading ? "..." : `${(flightCount * 1850000).toLocaleString("vi-VN")}đ`}
              </strong>
              <small className="kpi-desc">Tổng lượt booking quy đổi</small>
            </div>
          </div>

          {/* CAPACITY RATE */}
          <div className="kpi-card">
            <div className="kpi-card-top">
              <div className="kpi-icon-box orange">
                <Activity size={24} />
              </div>
              <span className="kpi-trend neutral">Ổn định</span>
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Hiệu suất tải ghế</span>
              <strong className="kpi-number">94.8%</strong>
              <small className="kpi-desc">Tỷ lệ lấp đầy khoang bay</small>
            </div>
          </div>
        </section>

        {/* ================= FLIGHT MONITOR & ACTIONS ================= */}
        <div className="adm-two-columns">
          {/* CỘT TRÁI: DANH SÁCH CHUYẾN BAY GẦN ĐÂY */}
          <div className="adm-panel-card">
            <div className="adm-panel-header">
              <div>
                <h2>Giám sát chuyến bay hoạt động</h2>
                <p>Danh sách các chuyến bay hiện hành trong cơ sở dữ liệu</p>
              </div>
              <button
                type="button"
                className="btn-view-all"
                onClick={() => navigate("/admin/flights")}
              >
                Xem tất cả ({flightCount}) →
              </button>
            </div>

            {loading ? (
              <div className="adm-table-loading">Đang tải dữ liệu radar...</div>
            ) : recentFlights.length === 0 ? (
              <div className="adm-table-empty">
                <p>Chưa có chuyến bay nào trong hệ thống.</p>
                <button
                  type="button"
                  className="btn-adm-primary"
                  onClick={() => navigate("/admin/flights")}
                >
                  Tạo chuyến bay đầu tiên
                </button>
              </div>
            ) : (
              <div className="adm-table-container">
                <table className="adm-data-table">
                  <thead>
                    <tr>
                      <th>Mã chuyến</th>
                      <th>Hãng bay</th>
                      <th>Tuyến bay</th>
                      <th>Giờ bay</th>
                      <th>Giá vé</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFlights.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className="adm-flight-badge">
                            {item.flight_number || `FL-${item.id}`}
                          </span>
                        </td>
                        <td>
                          <strong>{item.airline || `Hãng #${item.airline_id}`}</strong>
                        </td>
                        <td>
                          <div className="adm-route-tag">
                            <span>{item.departure_code || item.from || "HAN"}</span>
                            <span className="arrow">➔</span>
                            <span>{item.arrival_code || item.to || "SGN"}</span>
                          </div>
                        </td>
                        <td>
                          <span className="adm-time-text">
                            {item.departure_time ? item.departure_time.substring(11, 16) || item.departure_time : "--:--"}
                          </span>
                        </td>
                        <td>
                          <strong className="adm-price-highlight">
                            {Number(item.price || 0).toLocaleString("vi-VN")}đ
                          </strong>
                        </td>
                        <td>
                          <span className={`adm-status-badge ${String(item.status || "AVAILABLE").toLowerCase()}`}>
                            {item.status || "AVAILABLE"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: BẢO MẬT & TÁC VỤ NHANH */}
          <div className="adm-side-panels">
            {/* TÁC VỤ NHANH */}
            <div className="adm-panel-card">
              <div className="adm-panel-header">
                <h2>Lối tắt tác vụ</h2>
              </div>
              <div className="adm-quick-shortcuts">
                <button
                  type="button"
                  className="shortcut-item"
                  onClick={() => navigate("/admin/flights")}
                >
                  <div className="shortcut-icon blue">✈</div>
                  <div>
                    <strong>Thêm / Sửa chuyến bay</strong>
                    <small>Cập nhật lịch bay, giá vé và sơ đồ ghế</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="shortcut-item"
                  onClick={() => navigate("/admin/users")}
                >
                  <div className="shortcut-icon purple">👥</div>
                  <div>
                    <strong>Phân quyền người dùng</strong>
                    <small>Cấp quyền Admin hoặc khóa tài khoản</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="shortcut-item"
                  onClick={() => navigate("/home")}
                >
                  <div className="shortcut-icon green">🌐</div>
                  <div>
                    <strong>Xem trang bán vé</strong>
                    <small>Kiểm tra trải nghiệm người dùng thực tế</small>
                  </div>
                </button>
              </div>
            </div>

            {/* BẢO MẬT HỆ THỐNG */}
            <div className="adm-panel-card security-card">
              <div className="security-icon-box">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3>Hệ thống an ninh tối đa</h3>
                <p>
                  Toàn bộ kết nối API được bảo vệ với JWT Authentication & Role-Based Access Control.
                </p>
              </div>
              <div className="security-status-indicator">
                <span className="dot" />
                <span>Mã hóa TLS 1.3 đang hoạt động</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
