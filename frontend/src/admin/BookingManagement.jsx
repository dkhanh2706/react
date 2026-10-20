import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, Filter, Mail, Plane, RefreshCw, Search, Ticket, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin/FlightManagement.css";
import "../styles/admin/UserManagement.css";
import "../styles/admin/BookingManagement.css";

const names = { PENDING: "Chờ thanh toán", CONFIRMED: "Đã xác nhận", EXPIRED: "Hết hạn", CANCELLED: "Đã hủy", PAYMENT_REVIEW: "Cần đối soát" };
const paymentNames = { PENDING: "Chờ thanh toán", SUCCESS: "Thành công", FAILED: "Thất bại", REFUNDED: "Đã hoàn tiền" };
const classes = { ECONOMY: "Phổ thông", BUSINESS: "Thương gia", FIRST: "Hạng nhất" };
const seatNames = { HOLD: "Đang giữ ghế", BOOKED: "Đã đặt", EXPIRED: "Hết hạn", CANCELLED: "Đã hủy" };
const flightNames = { AVAILABLE: "Theo lịch", DELAYED: "Hoãn giờ", CANCELLED: "Đã hủy", SCHEDULED: "Đã lên lịch" };
const money = value => `${Number(value || 0).toLocaleString("vi-VN")}đ`;
const dateTime = value => value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "Chưa có thông tin";
const flightDate = value => value ? String(value).slice(0, 10).split("-").reverse().join("/") : "Chưa có ngày bay";
const cancellationReason = b => b.cancellation_reason || (b.status === "CANCELLED" || b.cancelled_at ? "Chưa có lý do được lưu" : "—");
const flightNumber = b => b.flight_number_snapshot || b.details?.[0]?.flight_number || "Chưa có mã chuyến";

function Status({ value, labels = names }) {
  return <span className={`status-badge bk-status bk-status-${String(value).toLowerCase()}`}>{labels[value] || value || "Chưa rõ"}</span>;
}

function Dialog({ title, onClose, children, footer, danger = false, busy = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, []);
  const handleKey = event => {
    if (event.key === "Escape" && !busy) onClose();
    if (event.key !== "Tab") return;
    const items = [...ref.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')];
    const first = items[0], last = items.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first.focus(); }
  };
  return <div className="adm-modal-overlay bk-overlay" onClick={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
    <section ref={ref} tabIndex={-1} onKeyDown={handleKey} className={`adm-modal-card bk-dialog ${danger ? "bk-dialog-danger" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="adm-modal-header bk-dialog-header"><div className="bk-modal-heading"><span className={`bk-modal-icon ${danger ? "danger" : ""}`}>{danger ? <AlertTriangle size={23} /> : <Ticket size={23} />}</span><div><h2>{title}</h2><p>{danger ? "Kiểm tra thông tin đơn trước khi xác nhận" : "Thông tin khách hàng, hành trình và thanh toán"}</p></div></div><button className="btn-close-modal" aria-label="Đóng cửa sổ" disabled={busy} onClick={onClose}><X size={21} /></button></header>
      <div className="bk-dialog-body">{children}</div>
      {footer && <footer className="bk-dialog-footer">{footer}</footer>}
    </section>
  </div>;
}

function Field({ label, children }) {
  return <div className="bk-field"><dt>{label}</dt><dd>{children || "—"}</dd></div>;
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/bookings/admin").then(r => {
      if (active) { setBookings(r.data.data); setError(""); }
    }).catch(e => { if (active) setError(e.response?.data?.message || "Không tải được đơn đặt vé. Hãy thử lại."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  const filtered = useMemo(() => bookings.filter(b => (!status || b.status === status) &&
    [b.booking_code, b.customer_email, b.customer_name, b.flight_number_snapshot, ...(b.details || []).flatMap(d => [d.passenger_name, d.flight_number])]
      .some(v => String(v || "").toLowerCase().includes(query.trim().toLowerCase()))), [bookings, status, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const selected = bookings.find(b => b.id === selectedId);
  const beginDelete = booking => { setSelectedId(null); setDeleteTarget(booking); setConfirmation(""); };
  const deleteBooking = async () => {
    if (deleting || confirmation !== deleteTarget.booking_code) return;
    setDeleting(true);
    try {
      const response = await api.delete(`/bookings/${deleteTarget.id}`, { data: { booking_code: confirmation } });
      setBookings(items => items.filter(b => b.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success(response.data.message);
    } catch (e) { toast.error(e.response?.data?.message || "Không xóa được đơn đặt vé"); }
    finally { setDeleting(false); }
  };
  return <AdminLayout pageTitle="Quản lý đặt vé"><div className="adm-users-page bk-page">
    <header className="adm-page-header-row"><div><span className="adm-page-tag">BOOKING MANAGEMENT</span><h1>Quản lý đơn đặt vé</h1><p>Tra cứu khách hàng, chuyến bay, trạng thái và lịch sử thanh toán.</p></div>
      <button className="btn-refresh" disabled={loading} onClick={() => { setLoading(true); setRefresh(n => n + 1); }}><RefreshCw size={16} className={loading ? "spin" : ""} />Làm mới danh sách</button></header>
    <div className="adm-user-stats-row">
      <div className="u-stat-card"><div className="u-stat-icon blue"><Ticket size={22} /></div><div><span className="u-stat-label">Tổng số đơn đặt vé</span><strong className="u-stat-val">{loading ? "—" : bookings.length}</strong></div></div>
      <div className="u-stat-card"><div className="u-stat-icon green"><CheckCircle2 size={22} /></div><div><span className="u-stat-label">Đơn đã xác nhận</span><strong className="u-stat-val">{loading ? "—" : bookings.filter(b => b.status === "CONFIRMED").length}</strong></div></div>
      <div className="u-stat-card"><div className="u-stat-icon purple"><Clock3 size={22} /></div><div><span className="u-stat-label">Đơn chờ thanh toán</span><strong className="u-stat-val">{loading ? "—" : bookings.filter(b => b.status === "PENDING").length}</strong></div></div>
    </div>
    <section className="adm-content-card">
      <div className="adm-table-toolbar"><div className="adm-search-input-box"><Search size={18} className="search-icon" /><input aria-label="Tìm đơn đặt vé" placeholder="Tìm mã đơn, tên khách hoặc mã chuyến..." value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />{query && <button className="clear-search" aria-label="Xóa từ khóa tìm kiếm" onClick={() => { setQuery(""); setPage(1); }}><X size={14} /></button>}</div>
        <div className="adm-filter-group"><Filter size={16} className="filter-icon" /><select aria-label="Lọc trạng thái đơn" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Tất cả trạng thái</option>{Object.entries(names).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      </div>
      {error && <div className="bk-alert" role="alert">{error}</div>}
      {loading ? <div className="adm-table-empty-state"><div className="loading-spinner-circle" /><p>Đang tải danh sách đặt vé…</p></div> : <>
        <div className="adm-table-responsive"><table className="adm-modern-table bk-table"><thead><tr><th>Mã đơn / Ngày đặt</th><th>Khách hàng / Email</th><th>Chuyến bay / Ghế</th><th>Tổng tiền</th><th>Trạng thái / Lý do hủy</th><th className="text-right">Hành động</th></tr></thead>
          <tbody>{visible.map(b => <tr key={b.id}>
            <td><span className="bk-order-code" title={b.booking_code}>{b.booking_code}</span><small className="date-text">{dateTime(b.created_at)}</small></td>
            <td><div className="user-profile-cell"><div className="user-table-avatar">{b.customer_name?.trim().charAt(0).toUpperCase() || "K"}</div><div className="bk-customer"><strong className="user-name-text">{b.customer_name}</strong><span className="user-email-text" title={b.customer_email}><Mail size={12} />{b.customer_email}</span></div></div></td>
            <td><strong className="bk-flight-code"><Plane size={14} />{flightNumber(b)}</strong><small>{b.departure_place && b.arrival_place ? `${b.departure_place} → ${b.arrival_place}` : "Chưa lưu hành trình"} · Ghế {b.seat_number_snapshot || b.details?.[0]?.seat_number || "—"}</small></td>
            <td><strong className="price-tag-modern">{money(b.total_price)}</strong></td>
            <td><Status value={b.status} />{(b.cancellation_reason || b.cancelled_at || b.status === "CANCELLED") && <span className="bk-reason" title={cancellationReason(b)}>{cancellationReason(b)}</span>}</td>
            <td className="text-right"><div className="action-buttons-inline"><button className="btn-action edit bk-view" onClick={() => setSelectedId(b.id)} title="Xem chi tiết đơn"><Eye size={15} /><span className="btn-action-text">Xem</span></button><button className="btn-action delete" aria-label={`Xóa đơn ${b.booking_code}`} title="Xóa đơn đặt vé" onClick={() => beginDelete(b)}><Trash2 size={15} /></button></div></td>
          </tr>)}</tbody></table></div>
        {!visible.length && !error && <div className="adm-table-empty-state"><Ticket size={36} /><h3>Không tìm thấy đơn đặt vé</h3><p>Thử tìm kiếm với từ khóa hoặc bộ lọc trạng thái khác.</p></div>}
        <footer className="bk-pagination"><span>{filtered.length ? `${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, filtered.length)}` : "0"} / {filtered.length} đơn</span><div><button className="bk-icon-button" aria-label="Trang trước" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={18} /></button><span>Trang {currentPage} / {pages}</span><button className="bk-icon-button" aria-label="Trang sau" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={18} /></button></div></footer>
      </>}
    </section>
    {selected && <Dialog title="Chi tiết đơn đặt vé" onClose={() => setSelectedId(null)} footer={<><button className="bk-delete" onClick={() => beginDelete(selected)}><Trash2 size={16} />Xóa đơn đặt vé</button><button className="btn-cancel" onClick={() => setSelectedId(null)}>Đóng chi tiết</button></>}>
      <div className="bk-detail-summary"><div><span className="bk-label">Mã đơn</span><strong className="bk-detail-code">{selected.booking_code}</strong><span className="bk-muted">Tạo lúc {dateTime(selected.created_at)}</span></div><div className="bk-summary-right"><Status value={selected.status} /><span className="bk-label">Tổng tiền đơn</span><strong className="bk-total">{money(selected.total_price)}</strong></div></div>
      {(selected.cancellation_reason || selected.cancelled_at || selected.status === "CANCELLED") && <section className="bk-cancellation"><h3>Lý do hủy đơn</h3><p>{cancellationReason(selected)}</p><small>Thời gian hủy: {dateTime(selected.cancelled_at)}</small></section>}
      <div className="bk-detail-grid"><section className="bk-panel"><h3>Khách hàng đặt vé</h3><dl><Field label="Họ và tên">{selected.customer_name}</Field><Field label="Email tài khoản">{selected.customer_email}</Field></dl></section>
        <section className="bk-panel"><h3>Vé lúc đặt</h3><div className="bk-route"><strong>{selected.departure_place || "—"}</strong><ArrowRight size={20} /><strong>{selected.arrival_place || "—"}</strong></div><dl className="bk-fields-grid"><Field label="Chuyến bay">{selected.flight_number_snapshot}</Field><Field label="Hãng bay">{selected.airline_name}</Field><Field label="Ngày bay">{flightDate(selected.flight_date)}</Field><Field label="Giờ đi / đến">{selected.departure_time_text && selected.arrival_time_text ? `${selected.departure_time_text} – ${selected.arrival_time_text}` : "Chưa lưu lịch bay"}</Field></dl></section></div>
      <section className="bk-panel"><h3>Hành khách & chỗ ngồi <span className="bk-count">{selected.details?.length || 0}</span></h3>
        {(selected.details || []).map((d, index) => <div className="bk-passenger" key={d.id}><div className="bk-passenger-heading"><span className="bk-avatar">{index + 1}</span><div><strong>{d.passenger_name || "Chưa nhập hành khách"}</strong><small>{classes[d.seat_class] || d.seat_class} · Ghế {d.seat_number || "—"}</small></div><span className="bk-seat-state">{seatNames[d.seat_status] || d.seat_status}</span></div>
          <dl className="bk-fields-grid"><Field label="Email hành khách">{d.email}</Field><Field label="Điện thoại">{d.phone}</Field><Field label="Chuyến hiện tại">{d.flight_number}</Field><Field label="Trạng thái chuyến">{flightNames[d.flight_status] || d.flight_status}</Field><Field label="Khởi hành hiện tại">{dateTime(d.departure_time)}</Field><Field label="Đến nơi hiện tại">{dateTime(d.arrival_time)}</Field></dl></div>)}
        {!selected.details?.length && <p className="bk-muted">Chưa có thông tin hành khách.</p>}
      </section>
      <section className="bk-panel"><h3>Lịch sử thanh toán <span className="bk-count">{selected.payments?.length || 0}</span></h3>
        {selected.payments?.length ? <div className="bk-table-scroll"><table className="bk-table bk-payment-table"><thead><tr><th>Phương thức / thời gian</th><th>Số tiền</th><th>Trạng thái</th><th>Mã giao dịch</th></tr></thead><tbody>{selected.payments.map(p => <tr key={p.id}><td><strong>{p.method === "MOCK" ? "Giả lập (Demo)" : p.method}</strong><small>{dateTime(p.paid_at || p.created_at)}</small></td><td><strong>{money(p.amount)}</strong></td><td><Status value={p.status} labels={paymentNames} /></td><td className="bk-transaction">{p.transaction_id || p.momo_order_id || "—"}</td></tr>)}</tbody></table></div> : <p className="bk-muted">Chưa có giao dịch thanh toán.</p>}
      </section>
      {!!selected.reviews?.length && <section className="bk-panel"><h3>Đối soát / hoàn tiền</h3>{selected.reviews.map(r => <div className="bk-review" key={r.id}><Status value={r.status} labels={{ OPEN: "Đang đối soát", REFUNDED: "Đã hoàn tiền" }} /><p>{r.reason}</p><dl className="bk-fields-grid"><Field label="Ghi chú xử lý">{r.resolution_note}</Field><Field label="Mã hoàn tiền">{r.refund_reference}</Field></dl></div>)}</section>}
    </Dialog>}
    {deleteTarget && <Dialog title="Xóa vĩnh viễn đơn đặt vé?" danger busy={deleting} onClose={() => setDeleteTarget(null)} footer={<><button className="bk-button" disabled={deleting} onClick={() => setDeleteTarget(null)}>Giữ lại đơn</button><button className="bk-delete bk-delete-solid" disabled={deleting || confirmation !== deleteTarget.booking_code} onClick={deleteBooking}><Trash2 size={16} />{deleting ? "Đang xóa…" : "Xóa vĩnh viễn"}</button></>}>
      <div className="bk-delete-summary"><strong>{deleteTarget.customer_name}</strong><span>{money(deleteTarget.total_price)}</span><Status value={deleteTarget.status} /></div>
      <p>Đơn sẽ bị xóa cùng thông tin hành khách, vé, lịch sử thanh toán và hồ sơ đối soát liên quan. Ghế đang giữ hoặc đã đặt của đơn sẽ được giải phóng. Vé cũng biến mất khỏi tài khoản khách hàng.</p>
      <div className="bk-alert">Thao tác không thể hoàn tác và không hoàn tiền qua MoMo. Xóa giao dịch sẽ thay đổi số liệu thanh toán, doanh thu trong hệ thống.</div>
      <label className="bk-confirm-label">Nhập đầy đủ mã đơn để xác nhận<strong>{deleteTarget.booking_code}</strong><input autoComplete="off" spellCheck={false} value={confirmation} disabled={deleting} onChange={e => setConfirmation(e.target.value)} placeholder="Nhập mã đơn ở trên" /></label>
    </Dialog>}
  </div></AdminLayout>;
}
