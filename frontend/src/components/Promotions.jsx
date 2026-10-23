import { useEffect, useState } from "react";
import api from "../api/axios";
import { airportName } from "../utils/airportNames";
import "../styles/Promotions.css";

function Promotions() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data } = await api.get("/reviews");
        if (active) { setReviews(data.data); setError(false); }
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    }
    load();
    const timer = setInterval(load, 15000);
    window.addEventListener("focus", load);
    window.addEventListener("storage", load);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", load); window.removeEventListener("storage", load); };
  }, []);

  return <section className="customer-reviews"><div className="reviews-wrapper">
    <div className="reviews-header"><span className="reviews-small-title">TRẢI NGHIỆM KHÁCH HÀNG</span><h2>Khách hàng nói gì về chúng tôi?</h2><p>Những chia sẻ mới nhất từ khách hàng đã thanh toán và xác nhận vé thành công.</p></div>
    {error ? <p className="reviews-message" role="status">Chưa tải được đánh giá. Hệ thống sẽ tự thử lại.</p> : loading ? <p className="reviews-message" role="status">Đang tải đánh giá…</p> : !reviews.length ? <p className="reviews-message">Chưa có đánh giá. Hãy chia sẻ trải nghiệm từ vé đã thanh toán của bạn!</p> : null}
    {!error && <div className="reviews-container">{reviews.map((review, index) => <article className="review-card" key={review.id}>
      <div className="quote-icon" aria-hidden="true">“</div><span className="review-order">#{index + 1}{index === 0 ? " · Mới nhất" : ""}</span>
      <div className="review-stars" aria-label={`${review.rating} trên 5 sao`}>{[1,2,3,4,5].map(star => <span key={star} aria-hidden="true" className={star <= review.rating ? "star active" : "star"}>★</span>)}</div>
      <p className="review-comment">{review.comment}</p><div className="review-trip"><span className="plane-icon" aria-hidden="true">✈</span>{airportName(review.departure_place)} → {airportName(review.arrival_place)}</div>
      <div className="review-user"><div className="review-avatar">{review.name.trim().split(/\s+/).slice(-2).map(part => part[0]).join("")}</div><div className="review-user-info"><h3>{review.name}</h3><div className="verified-review"><span>✓</span>Đã thanh toán vé</div><small>Đánh giá ngày {new Date(review.created_at).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</small></div></div>
    </article>)}</div>}
  </div></section>;
}

export default Promotions;
