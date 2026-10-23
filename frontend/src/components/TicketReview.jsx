import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { airportName } from "../utils/airportNames";

export default function TicketReview({ ticket, review, ready, onChange }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const paid = ticket.status === "CONFIRMED" && ticket.payment_status === "SUCCESS";
  if (!paid && !review) return null;

  async function submit(event) {
    event.preventDefault();
    if (!rating) return toast.error("Bạn hãy chọn số sao trước khi gửi");
    setBusy(true);
    try {
      const { data } = await api.post(`/reviews/${ticket.id}`, { rating, comment });
      onChange({ ...data.data, booking_id: ticket.id, customer_reviewed_at: data.data.created_at });
      localStorage.setItem("customer_reviews_changed", String(Date.now()));
      setOpen(false);
      toast.success("Đã đăng đánh giá lên trang chủ");
    } catch (error) {
      toast.error(error.response?.data?.message || "Chưa gửi được đánh giá. Vui lòng thử lại");
    } finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    try {
      await api.delete(`/reviews/${review.id}`);
      onChange({ booking_id: ticket.id, customer_reviewed_at: review.customer_reviewed_at });
      localStorage.setItem("customer_reviews_changed", String(Date.now()));
      setConfirmDelete(false);
      toast.success("Đã xóa đánh giá");
    } catch (error) {
      toast.error(error.response?.data?.message || "Chưa xóa được đánh giá");
    } finally { setBusy(false); }
  }

  return <section className="ticket-review-section" aria-label="Đánh giá vé">
    {review ? review.id ? <>
      <div className="ticket-review-heading"><strong>Đánh giá của bạn · {review.rating}/5 sao</strong><button type="button" disabled={busy} onClick={() => setConfirmDelete(true)}>Xóa đánh giá</button></div>
      <p className="ticket-review-comment">{review.comment}</p>
      {confirmDelete && <div className="ticket-review-confirm"><p>Xóa vĩnh viễn đánh giá này? Bạn sẽ không thể đánh giá lại đơn vé này.</p><button type="button" disabled={busy} onClick={remove}>{busy ? "Đang xóa…" : "Xóa vĩnh viễn"}</button><button type="button" disabled={busy} onClick={() => setConfirmDelete(false)}>Giữ lại</button></div>}
    </> : <p>Bạn đã đánh giá đơn vé này. Đánh giá đã được xóa và không thể gửi lại.</p> : <>
      <div className="ticket-review-heading"><div><strong>Chia sẻ trải nghiệm đặt vé</strong><p>Đánh giá của bạn sẽ xuất hiện trên trang chủ.</p></div><button type="button" disabled={!ready} aria-expanded={open} onClick={() => setOpen(!open)}>★ {open ? "Đóng đánh giá" : "Viết đánh giá"}</button></div>
      {!ready && <small>Tính năng đánh giá hiện chưa sẵn sàng.</small>}
      {open && <form className="ticket-review-form" onSubmit={submit}>
        <div className="ticket-review-route"><span>Điểm đi <strong>{airportName(ticket.departure_place)}</strong></span><span aria-hidden="true">✈</span><span>Điểm đến <strong>{airportName(ticket.arrival_place)}</strong></span></div>
        <fieldset disabled={busy}><legend>Trải nghiệm của bạn · {rating}/5 sao</legend><div className="ticket-review-stars">{[1,2,3,4,5].map(star => <label key={star}><input type="radio" name={`rating-${ticket.id}`} value={star} checked={rating === star} onChange={() => setRating(star)} required /><span className={star <= rating ? "selected" : ""}>★</span><span className="review-sr-only">{star} sao</span></label>)}</div></fieldset>
        <label htmlFor={`comment-${ticket.id}`}>Nội dung đánh giá</label>
        <textarea id={`comment-${ticket.id}`} value={comment} onChange={event => setComment(event.target.value)} required maxLength={1000} rows={4} disabled={busy} placeholder="Chia sẻ cảm nhận của bạn về trải nghiệm đặt vé…" />
        <small>{comment.length}/1000 ký tự · Chỉ gửi một lần, có thể xóa, không thể sửa.</small>
        <button type="submit" disabled={busy || !rating || !comment.trim()}>{busy ? "Đang gửi…" : "Gửi đánh giá"}</button>
      </form>}
    </>}
  </section>;
}
