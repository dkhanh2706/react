import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plane, CreditCard, Armchair, Ticket, TrendingUp, FlaskConical, RefreshCw, CalendarDays } from "lucide-react";
import { formatDate, formatDateTime, formatMoney, formatNumber, vietnamToday } from "../utils/format.js";
import api from "../api/axios";
import AdminLayout from "../layouts/AdminLayout";
import { PeriodChart, SeatChart } from "../components/admin/DashboardCharts.jsx";
import "../styles/admin/AdminDashboard.css";

const statuses = { AVAILABLE: "Mở bán", DELAYED: "Hoãn", CANCELLED: "Đã hủy", SCHEDULED: "Đã lên lịch" };
function presetRange(preset) {
  const to = vietnamToday();
  let from = to;
  if (preset === "week") { const date = new Date(`${to}T00:00:00Z`); date.setUTCDate(date.getUTCDate() - 6); from = date.toISOString().slice(0, 10); }
  if (preset === "month") from = `${to.slice(0, 7)}-01`;
  return { from, to, group: "day" };
}

function Metric({ title, value, note, icon: Icon, accent = "purple" }) {
  return <article className={`dash-metric dash-accent-${accent}`}><div className="dash-metric-label"><span>{title}</span><Icon size={19} /></div><strong>{value}</strong><p>{note}</p></article>;
}

export default function AdminDashboard() {
  const [range, setRange] = useState(() => presetRange("month"));
  const [draft, setDraft] = useState(range);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filterError, setFilterError] = useState("");
  const [flightQuery, setFlightQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    api.get("/flights/statistics", { params: range, signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return;
      setResult(data); setLoadError(""); setLoading(false);
    }).catch(error => {
      if (controller.signal.aborted) return;
      setResult(null); setLoadError(error.response?.data?.message || "Không tải được thống kê. Vui lòng thử lại."); setLoading(false);
    });
    return () => controller.abort();
  }, [range, revision]);

  const applyRange = next => {
    const days = (Date.parse(`${next.to}T00:00:00Z`) - Date.parse(`${next.from}T00:00:00Z`)) / 86400000 + 1;
    if (!next.from || !next.to || !Number.isFinite(days) || days < 1 || days > 366) { setFilterError("Chọn ngày bắt đầu không sau ngày kết thúc, tối đa 366 ngày."); return; }
    setFilterError(""); setLoading(true); setLoadError(""); setPage(1);
    setRange({ ...next });
  };
  const filteredFlights = useMemo(() => (result?.flights || []).filter(f => (!status || f.status === status) && `${f.flight_number} ${f.departure_code} ${f.arrival_code} ${f.airline}`.toLowerCase().includes(flightQuery.trim().toLowerCase())), [result, status, flightQuery]);
  const totalPages = Math.max(1, Math.ceil(filteredFlights.length / 10));
  const visibleFlights = filteredFlights.slice((page - 1) * 10, page * 10);
  const summary = result?.summary;

  return <AdminLayout pageTitle="Tổng quan Dashboard"><div className="dash-page">
    <header className="dash-heading"><div><span className="dash-eyebrow">THỐNG KÊ KINH DOANH</span><h1>Tổng quan hoạt động</h1><p>Theo dõi chuyến bay, doanh số và tỷ lệ lấp đầy ghế.</p></div><button type="button" className="dash-button" disabled={loading} onClick={() => { setLoading(true); setLoadError(""); setRevision(value => value + 1); }}><RefreshCw size={16} className={loading ? "dash-spin" : ""} />Làm mới</button></header>
    <section className="dash-panel dash-filters" aria-label="Bộ lọc thống kê">
      <div className="dash-presets">{[["today", "Hôm nay"], ["week", "7 ngày"], ["month", "Tháng này"]].map(([key, label]) => <button key={key} type="button" className="dash-button" disabled={loading} onClick={() => { const next = presetRange(key); setDraft(next); applyRange(next); }}>{label}</button>)}</div>
      <form onSubmit={event => { event.preventDefault(); applyRange(draft); }}>
        <label>Từ ngày<input type="date" name="from" required value={draft.from} onChange={event => setDraft(current => ({ ...current, from: event.target.value }))} /></label>
        <label>Đến ngày<input type="date" name="to" required value={draft.to} onChange={event => setDraft(current => ({ ...current, to: event.target.value }))} /></label>
        <label>Biểu đồ theo<select value={draft.group} onChange={event => setDraft(current => ({ ...current, group: event.target.value }))}><option value="day">Ngày</option><option value="month">Tháng</option></select></label>
        <button type="submit" className="dash-button dash-button-primary" disabled={loading}><CalendarDays size={16} />Áp dụng</button>
      </form>
      {filterError && <p role="alert" className="dash-error">{filterError}</p>}
    </section>
    {loading ? <div className="dash-panel dash-loading" role="status">Đang tải số liệu thống kê...</div> : loadError ? <div className="dash-panel dash-error" role="alert">{loadError}<button className="dash-button" onClick={() => { setLoading(true); setRevision(value => value + 1); }}>Thử lại</button></div> : summary && <>
      <div className="dash-period"><span>{formatDate(range.from)} – {formatDate(range.to)}</span><small>Cập nhật: {formatDateTime(result.updated_at)}</small></div>
      <section className="dash-metrics" aria-label="Số liệu tổng quan">
        <Metric title="Tổng chuyến bay" icon={Plane} value={formatNumber(summary.flight_count)} note={`Theo ngày khởi hành · ${summary.available_flights} mở bán · ${summary.delayed_flights} hoãn · ${summary.cancelled_flights} hủy`} />
        <Metric title="Doanh thu MoMo" icon={CreditCard} value={formatMoney(summary.momo_revenue)} note="Theo ngày thanh toán · Không gồm MOCK, khoản chờ hoàn và đã hoàn tiền" accent="green" />
        <Metric title="Doanh số dự kiến" icon={TrendingUp} value={formatMoney(summary.projected_sales)} note="Theo ngày khởi hành · Gồm đơn xác nhận hợp lệ (cả MOCK) và đơn chờ còn hạn" />
        <Metric title="Tỷ lệ lấp đầy ghế" icon={Armchair} value={summary.occupancy_rate === null ? "—" : `${summary.occupancy_rate.toFixed(1)}%`} note={summary.offered_seats ? `${formatNumber(summary.booked_seats)}/${formatNumber(summary.offered_seats)} ghế đã bán · Theo ngày khởi hành` : "Chưa có ghế cung ứng trong kỳ"} accent="orange" />
        <Metric title="Ghế đã bán" icon={Ticket} value={formatNumber(summary.booked_seats)} note="Theo ngày khởi hành · Đơn xác nhận · Không gồm chuyến hủy" />
        <Metric title="Thanh toán MOCK" icon={FlaskConical} value={formatMoney(summary.mock_revenue)} note="Theo ngày thanh toán · Số tiền giả lập, hiển thị riêng với MoMo" accent="teal" />
      </section>
      <section className="dash-projection dash-panel" aria-label="Công thức doanh số dự kiến"><div><h2>Doanh số dự kiến từ đơn hiện có</h2><p><strong>{formatMoney(summary.confirmed_value)}</strong> đơn xác nhận hợp lệ + <strong>{formatMoney(summary.pending_value)}</strong> đơn chờ thanh toán còn hạn = <strong>{formatMoney(summary.projected_sales)}</strong></p><p>Giả định các đơn chờ đều thanh toán thành công. Gồm giá vé và dịch vụ đã lưu trong đơn; không phải dự báo doanh số cuối tháng.</p></div></section>
      <div className="dash-charts-grid">
        <PeriodChart title="Doanh thu theo thời gian" description="Theo ngày thanh toán thành công; hai cột riêng cho MoMo và MOCK." points={result.revenue_series} series={["momo", "mock"]} money group={range.group} />
        <PeriodChart title="Số chuyến theo thời gian" description="Theo ngày khởi hành và trạng thái hiện tại của chuyến." points={result.flight_series} series={["available", "delayed", "cancelled", "other"]} group={range.group} />
      </div>
      <SeatChart summary={summary} />
      <section className="dash-panel dash-flight-panel" aria-label="Hiệu suất từng chuyến">
        <div className="dash-panel-heading"><div><h2>Hiệu suất từng chuyến</h2><p>Theo ngày khởi hành trong kỳ · {formatNumber(filteredFlights.length)} chuyến phù hợp</p></div><Link to="/admin/flights">Quản lý chuyến bay →</Link></div>
        <div className="dash-table-filters"><label>Tìm chuyến<input type="search" value={flightQuery} placeholder="Mã chuyến, tuyến, hãng bay" onChange={event => { setFlightQuery(event.target.value); setPage(1); }} /></label><label>Trạng thái<select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">Tất cả</option>{[...new Set(result.flights.map(f => f.status))].map(value => <option key={value} value={value}>{statuses[value] || value}</option>)}</select></label></div>
        <div className="dash-table-scroll"><table><thead><tr><th>Chuyến / Tuyến</th><th>Khởi hành</th><th>Trạng thái</th><th>Tổng ghế</th><th>Đã bán</th><th>Đang giữ</th><th>Còn trống</th><th>Lấp đầy</th><th>Doanh số dự kiến</th></tr></thead><tbody>
          {visibleFlights.length ? visibleFlights.map(f => <tr key={f.id}><td><strong>{f.flight_number}</strong><small>{f.departure_code} → {f.arrival_code} · {f.airline}</small></td><td>{formatDate(f.departure_date)}<small>{f.departure_clock}</small></td><td><span className={`dash-status dash-status-${String(f.status).toLowerCase()}`}>{statuses[f.status] || f.status || "Chưa rõ"}</span></td><td>{f.total_seats}</td><td>{f.booked_seats}</td><td>{f.held_seats}</td><td>{f.empty_seats ?? "—"}</td><td>{f.occupancy_rate === null ? "—" : <div className="dash-rate"><span>{f.occupancy_rate.toFixed(1)}%</span><progress value={f.booked_seats} max={f.total_seats} aria-label={`Tỷ lệ lấp đầy ${f.flight_number}`} /></div>}</td><td>{f.status === "CANCELLED" ? "—" : formatMoney(f.confirmed_value + f.pending_value)}</td></tr>) : <tr><td colSpan={9} className="dash-empty">Không có chuyến bay phù hợp với bộ lọc.</td></tr>}
        </tbody></table></div>
        <div className="dash-pagination"><span>Trang {page}/{totalPages}</span><div><button type="button" className="dash-button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Trước</button><button type="button" className="dash-button" disabled={page >= totalPages} onClick={() => setPage(value => value + 1)}>Sau</button></div></div>
        <p className="dash-footnote">Chuyến hủy không tính vào ghế cung ứng, tỷ lệ lấp đầy hoặc doanh số dự kiến. Số chuyến chỉ gồm các chuyến đã được tạo trong hệ thống; lịch demo phát sinh khi tìm kiếm.</p>
      </section>
    </>}
  </div></AdminLayout>;
}
