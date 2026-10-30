import { formatNumber } from "../../utils/format.js";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/admin/RefundReview.css";
export default function RefundReview({
  review,
  payment,
  onSaved
}) {
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    if (busy || !confirmed) return;
    setBusy(true);
    try {
      await api.post(`/payments/reviews/${review.id}/refund`, {
        note: note.trim(),
        refund_reference: reference.trim()
      });
      toast.success("Đã ghi nhận hoàn tiền, giữ nguyên lịch sử giao dịch");
      await onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || "Chưa ghi nhận được hoàn tiền. Hãy tải lại trạng thái trước khi thử lại.");
    } finally {
      setBusy(false);
    }
  };
  return <section className="refund-review">
    <h4>Hồ sơ đối soát #{review.id}</h4>
    <p>Giao dịch #{payment?.id || review.payment_id || "—"}{payment && ` · ${payment.method === "MOCK" ? "Giả lập" : payment.method} · ${formatNumber(payment.amount)}đ`}</p>
    <p>{review.reason}</p>
    {review.status === "REFUNDED" ? <><strong>Đã ghi nhận hoàn tiền</strong><p>Mã xác nhận: {review.refund_reference || "—"}</p><p>{review.resolution_note}</p></> : <form onSubmit={submit}>
        <p>Chỉ xác nhận sau khi đã hoàn khoản tiền tương ứng. Thao tác này ghi nhận kết quả, không chuyển tiền qua MoMo. Giao dịch giả lập không cần chuyển tiền thật.</p>
        <label>Mã xác nhận hoàn tiền<input required maxLength={200} value={reference} onChange={e => setReference(e.target.value)} disabled={busy} /></label>
        <label>Ghi chú xử lý<textarea required minLength={5} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} disabled={busy} rows={3} /></label>
        <label className="refund-confirm"><input type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} disabled={busy} />Tôi xác nhận đã hoàn khoản tiền của giao dịch này (hoặc xử lý giả lập).</label>
        <button type="submit" disabled={busy || !confirmed || !reference.trim() || note.trim().length < 5}>{busy ? "Đang ghi nhận…" : "Ghi nhận đã hoàn tiền"}</button>
      </form>}
  </section>;
}
