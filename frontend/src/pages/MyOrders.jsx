import { formatDate, formatDateTime, formatNumber as money } from "../utils/format.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Clock3, CreditCard, Filter, History, Info, MapPin, Plane, RefreshCw, Ticket, TicketCheck } from "lucide-react";
import api from "../api/axios";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";
import { airportName } from "../utils/airportNames";
import "../styles/MyOrders.css";

const statuses = { PENDING: "Chờ thanh toán", CONFIRMED: "Đã thanh toán", EXPIRED: "Hết hạn giữ ghế", CANCELLED: "Đã hủy", PAYMENT_REVIEW: "Cần đối soát", REFUNDED: "Đã hoàn tiền" };

const statusOf = (order, now) => order.payment_status === "REFUNDED" ? "REFUNDED"
  : order.status === "PENDING" && new Date(order.hold_expires_at).getTime() <= now ? "EXPIRED" : order.status;

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await api.get("/bookings/mine");
        if (active) { setOrders(data.data); setError(""); setNow(Date.now()); }
      } catch (e) { if (active) setError(e.response?.data?.message || "Không tải được đơn đặt vé"); }
      finally { if (active) { setLoading(false); setRefreshing(false); } }
    };
    load();
    const reload = () => load();
    window.addEventListener("focus", reload);
    const timer = setInterval(() => { setNow(Date.now()); load(); }, 15000);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", reload); };
  }, [refresh]);
  const visibleOrders = orders.filter(order => !filter || statusOf(order, now) === filter);
  const pendingCount = orders.filter(order => statusOf(order, now) === "PENDING").length;
  const confirmedCount = orders.filter(order => statusOf(order, now) === "CONFIRMED").length;
  const refreshOrders = () => { setRefreshing(true); setRefresh(n => n + 1); };

  return <div className="orders-wrapper"><Header /><main className="orders-page">
    <nav className="orders-breadcrumb" aria-label="Đường dẫn"><Link to="/home">Trang chủ</Link><ChevronRight size={13} /><span>Đơn đặt vé của tôi</span></nav>
    <header className="orders-heading">
      <div><span className="orders-eyebrow"><Ticket size={13} /> HÀNH TRÌNH CỦA BẠN</span><h1>Đơn đặt vé của tôi</h1><p>Mọi hành trình, một nơi quản lý. Tiếp tục thanh toán và sẵn sàng cất cánh.</p></div>
      <Link className="orders-button orders-button-outline" to="/my-tickets"><TicketCheck size={17} /> Vé đã thanh toán<ArrowUpRight size={16} /></Link>
    </header>

    <div className="orders-stats" aria-label="Tổng quan đơn đặt vé">
      {[{ label: "Tất cả đơn", count: orders.length, value: "", icon: Ticket, color: "blue" },
        { label: "Chờ thanh toán", count: pendingCount, value: "PENDING", icon: Clock3, color: "amber" },
        { label: "Đã thanh toán", count: confirmedCount, value: "CONFIRMED", icon: CheckCircle2, color: "green" }].map(({ label, count, value, icon: Icon, color }) =>
        <button type="button" key={color} className={`orders-stat ${filter === value ? "is-selected" : ""}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>
          <span className={`orders-stat-icon ${color}`}><Icon size={21} /></span><span><span className="orders-stat-label">{label}</span><strong>{loading ? "—" : count}</strong></span><ChevronRight size={17} className="orders-stat-arrow" />
        </button>)}
    </div>

    <section className="orders-history" aria-label="Danh sách đơn đặt vé">
      <div className="orders-toolbar">
        <div className="orders-toolbar-title"><h2>Lịch sử đặt vé</h2><span>{loading ? "Đang cập nhật…" : `${visibleOrders.length} đơn đặt vé`}</span></div>
        <div className="orders-tools"><label className="orders-select"><Filter size={15} /><span className="orders-sr-only">Lọc trạng thái đơn</span><select value={filter} onChange={e => setFilter(e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={14} /></label>
          <button type="button" className="orders-refresh" onClick={refreshOrders} disabled={loading || refreshing}><RefreshCw size={16} className={refreshing ? "orders-spin" : ""} /><span>{refreshing ? "Đang tải…" : "Làm mới"}</span></button>
        </div>
      </div>
      {error && <div className="orders-error" role="alert"><Info size={18} /><span>{error}</span><button type="button" onClick={refreshOrders} disabled={refreshing}>Thử lại</button></div>}
      {loading ? <div className="orders-loading" role="status"><RefreshCw size={26} className="orders-spin" /><p>Đang tìm lại những hành trình của bạn…</p></div> :
        <div className="orders-list">{visibleOrders.map(order => {
          const status = statusOf(order, now);
          const payable = order.can_pay && status === "PENDING";
          const confirmed = status === "CONFIRMED";
          return <article className={`orders-card ${payable ? "orders-card-pending" : ""}`} key={order.id}>
            <div className="orders-card-top"><div className="orders-airline"><span className="orders-airline-logo"><Plane size={21} /></span><div><strong>{order.airline_name || "Thông tin chuyến bay"}</strong><span>{order.flight_number_snapshot || "—"}<span className="orders-meta-dot">·</span>Bay thẳng</span></div></div>
              <span className={`orders-status orders-status-${status.toLowerCase()}`}><span />{statuses[status] || status}</span>
            </div>
            <div className="orders-card-body"><div className="orders-itinerary">
              <div className="orders-flight-date"><CalendarDays size={15} /><span>Khởi hành <strong>{formatDate(order.flight_date, { fallback: "—" })}</strong></span><span className="orders-seat"><Ticket size={14} /> Ghế {order.seat_number_snapshot || "—"}</span></div>
              <div className="orders-route">
                <div className="orders-airport"><span className="orders-flight-time">{order.departure_time_text || "--:--"}</span><strong>{order.departure_place || "—"}</strong><span>{airportName(order.departure_place)}</span></div>
                <div className="orders-flight-path" aria-hidden="true"><span /><i /><Plane size={20} /><i /><MapPin size={15} /></div>
                <div className="orders-airport orders-airport-arrival"><span className="orders-flight-time">{order.arrival_time_text || "--:--"}</span><strong>{order.arrival_place || "—"}</strong><span>{airportName(order.arrival_place)}</span></div>
              </div>
              <div className="orders-reference"><span>Mã đặt chỗ</span><strong title={order.booking_code}>{order.booking_code}</strong></div>
            </div>
            <aside className="orders-checkout" aria-label="Thanh toán đơn"><span className="orders-price-label">Tổng tiền đặt vé</span><strong className="orders-price">{money(order.total_price)}<small>đ</small></strong>
              <span className="orders-price-note">Đã gồm dịch vụ bạn lựa chọn</span>
              {payable ? <Link className="orders-button orders-button-primary" to={`/payment?bookingId=${order.id}`}>Tiếp tục thanh toán<ArrowRight size={17} /></Link>
                : confirmed ? <Link className="orders-button orders-button-primary" to="/my-tickets"><TicketCheck size={17} /> Xem vé của tôi</Link>
                  : <Link className="orders-button orders-button-outline" to="/destinations">Tìm chuyến mới<ArrowRight size={17} /></Link>}
              {order.status !== "PENDING" && <Link className="orders-status-link" to={`/payment-result?bookingId=${order.id}`}>Chi tiết giao dịch<ChevronRight size={14} /></Link>}
            </aside></div>
            {order.status === "PENDING" && <div className={`orders-notice ${payable ? "orders-notice-hold" : ""}`}><Clock3 size={16} /><span>{status === "EXPIRED" ? "Thời gian giữ ghế đã kết thúc. Bạn có thể tìm chuyến mới để đặt lại." : <>Giữ ghế đến <strong>{formatDateTime(order.hold_expires_at, { fallback: "—" })}</strong>. {payable ? "Thanh toán trước hạn để xác nhận hành trình." : "Chuyến bay hiện chưa đủ điều kiện tiếp tục thanh toán."}</>}</span></div>}
            {order.cancellation_reason && <div className="orders-notice"><Info size={16} /><span>Lý do hủy: {order.cancellation_reason}</span></div>}
            <div className="orders-card-bottom"><History size={13} /><span>Đặt lúc {formatDateTime(order.created_at, { fallback: "—" })}</span>{order.payment_method === "MOCK" && <span className="orders-demo-tag">Phương thức Demo</span>}</div>
          </article>;
        })}
        {!error && !visibleOrders.length && <div className="orders-empty"><span className="orders-empty-icon"><Ticket size={32} /></span><h3>{orders.length ? "Chưa có đơn ở trạng thái này" : "Hành trình mới đang chờ bạn"}</h3><p>{orders.length ? "Thử chọn trạng thái khác để xem lại các đơn đặt vé của bạn." : "Tìm chuyến bay yêu thích và tạo đơn đầu tiên. Mọi thông tin sẽ được lưu tại đây."}</p>
          {orders.length ? <button type="button" className="orders-button orders-button-outline" onClick={() => setFilter("")}>Xem tất cả đơn</button> : <Link className="orders-button orders-button-primary" to="/destinations">Khám phá chuyến bay<ArrowRight size={16} /></Link>}</div>}
      </div>}
    </section>
    <div className="orders-help"><CreditCard size={17} /><p>Đơn chờ thanh toán được giữ ghế trong 15 phút. Quay lại thanh toán không làm thay đổi giá đã lưu hoặc kéo dài hạn giữ ghế.</p></div>
  </main><Footer /></div>;
}
