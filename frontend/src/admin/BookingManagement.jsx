import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin/FlightManagement.css";
import "../styles/admin/BookingManagement.css";

const names = { PENDING: "Chờ thanh toán", CONFIRMED: "Đã xác nhận", EXPIRED: "Hết hạn", CANCELLED: "Đã hủy", PAYMENT_REVIEW: "Cần đối soát" };
const money = value => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [action, setAction] = useState(null);
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    api.get("/bookings/admin").then(r => { if (active) setBookings(r.data.data); })
      .catch(e => toast.error(e.response?.data?.message || "Không tải được đơn đặt vé"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);
  const filtered = useMemo(() => bookings.filter(b => (!status || b.status === status) &&
    [b.booking_code, b.customer_email, b.customer_name, b.flight_number_snapshot].some(v => String(v || "").toLowerCase().includes(query.trim().toLowerCase()))), [bookings, status, query]);
  const selected = bookings.find(b => b.id === selectedId);
  const beginAction = value => { setAction(value); setNote(""); setReference(""); setConfirmed(false); };
  const submit = async event => {
    event.preventDefault();
    if (saving || !confirmed) return;
    setSaving(true);
    try {
      const response = action.type === "cancel"
        ? await api.post(`/bookings/${action.id}/cancel`, { reason: note })
        : await api.post(`/payments/reviews/${action.id}/refund`, { note, refund_reference: reference });
      toast.success(response.data.message);
      setAction(null);
      setRefresh(n => n + 1);
    } catch (e) { toast.error(e.response?.data?.message || "Không thực hiện được thao tác"); }
    finally { setSaving(false); }
  };
  return <AdminLayout pageTitle="Quản lý đặt vé"><div className="adm-flights-page">
    <div className="adm-page-header-row"><div><h1>Quản lý đặt vé</h1><p>Đặt chỗ, lịch sử thanh toán và hồ sơ đối soát.</p></div>
      <button className="btn-refresh" onClick={() => setRefresh(n => n + 1)}>Làm mới</button></div>
    <div className="adm-content-card"><div className="adm-table-toolbar">
      <input aria-label="Tìm đơn đặt vé" placeholder="Mã đơn, email, tên khách, mã chuyến" value={query} onChange={e => setQuery(e.target.value)} />
      <select aria-label="Trạng thái đơn" value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(names).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
    </div>
      {loading ? <p>Đang tải…</p> : <div className="adm-table-responsive"><table className="adm-modern-table">
        <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Chuyến / ghế</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>{filtered.map(b => <tr key={b.id}><td>{b.booking_code}</td><td>{b.customer_name}<br />{b.customer_email}</td><td>{b.flight_number_snapshot || "Đang giữ ghế"} / {b.seat_number_snapshot || "—"}</td><td>{money(b.total_price)}</td><td>{names[b.status] || b.status}</td><td><button className="btn-refresh" onClick={() => setSelectedId(b.id)}>Chi tiết</button></td></tr>)}</tbody>
      </table>{!filtered.length && <p>Không tìm thấy đơn đặt vé.</p>}</div>}
    </div>
    {selected && <div className="adm-modal-overlay"><section className="adm-modal-card booking-detail-modal" role="dialog" aria-modal="true" aria-label="Chi tiết đặt vé">
      <div className="adm-modal-head"><h2>{selected.booking_code}</h2><button onClick={() => { setSelectedId(null); setAction(null); }} disabled={saving}>Đóng</button></div>
      <div className="booking-detail-body"><p>{selected.customer_name} — {selected.customer_email}</p><p>{names[selected.status]} · {money(selected.total_price)}</p>
        {selected.cancellation_reason && <p>Lý do hủy: {selected.cancellation_reason}</p>}
        <h3>Hành khách và chỗ ngồi</h3>{(selected.details || []).map(d => <p key={d.id}>{d.passenger_name || "Chưa nhập hành khách"} — {d.email || "—"} — {d.phone || "—"}<br />Chuyến #{d.flight_id}, ghế #{d.seat_id} ({d.seat_class}), {d.seat_status}</p>)}
        <h3>Lịch sử thanh toán</h3>{(selected.payments || []).length ? selected.payments.map(p => <p key={p.id}>#{p.id} — {p.method} — {money(p.amount)} — {p.status}<br />Mã giao dịch: {p.transaction_id || p.momo_order_id || "—"}</p>) : <p>Chưa có giao dịch.</p>}
        <h3>Đối soát / hoàn tiền</h3>{(selected.reviews || []).map(r => <div className="booking-review" key={r.id}><p>{r.reason} — {r.status}</p>
          {r.status === "OPEN" ? <button className="btn-refresh" onClick={() => beginAction({ type: "refund", id: r.id })}>Ghi nhận đã hoàn tiền</button> : <p>{r.resolution_note} · Mã hoàn tiền: {r.refund_reference}</p>}</div>)}
        {["PENDING", "CONFIRMED", "EXPIRED"].includes(selected.status) && <button className="btn-danger-confirm" onClick={() => beginAction({ type: "cancel", id: selected.id })}>Hủy đặt chỗ</button>}
        {action && <form className="booking-action-form" onSubmit={submit}>
          <h3>{action.type === "cancel" ? "Xác nhận hủy đặt chỗ" : "Xác nhận khoản tiền đã được hoàn"}</h3>
          <label>Lý do / ghi chú<textarea minLength={5} maxLength={action.type === "cancel" ? 1000 : 2000} value={note} onChange={e => setNote(e.target.value)} required /></label>
          {action.type === "refund" && <label>Mã xác nhận hoàn tiền<input maxLength={200} value={reference} onChange={e => setReference(e.target.value)} required /></label>}
          <label><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} required /> {action.type === "refund" ? "Tôi xác nhận tiền đã được hoàn thực tế; thao tác này chỉ ghi nhận kết quả." : "Tôi xác nhận hủy chỗ; khoản đã thanh toán sẽ được chuyển đối soát."}</label>
          <button className="btn-adm-primary" disabled={saving || !confirmed}>{saving ? "Đang lưu…" : "Xác nhận"}</button>
          <button type="button" className="btn-cancel" disabled={saving} onClick={() => setAction(null)}>Bỏ qua</button>
        </form>}
      </div></section></div>}
  </div></AdminLayout>;
}
