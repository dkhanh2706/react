import "../styles/Promotions.css";

// ======================================================
// DỮ LIỆU ĐÁNH GIÁ TẠM THỜI
// Sau này phần này sẽ được thay bằng dữ liệu từ API / database
// ======================================================
const defaultReviews = [
  {
    id: 1,
    name: "Nguyễn Minh Anh",
    avatar: "MA",
    rating: 5,
    route: "TP. Hồ Chí Minh → Hà Nội",
    date: "28/09/2026",
    comment:
      "Đặt vé rất nhanh, giao diện dễ sử dụng. Mình đặc biệt thích phần chọn ghế trực quan và thao tác thanh toán khá đơn giản.",
  },
  {
    id: 2,
    name: "Trần Quốc Huy",
    avatar: "QH",
    rating: 5,
    route: "Hà Nội → Đà Nẵng",
    date: "25/09/2026",
    comment:
      "Giá vé hợp lý, tìm chuyến bay nhanh và thông tin rõ ràng. Trải nghiệm đặt vé rất thuận tiện.",
  },
  {
    id: 3,
    name: "Lê Ngọc Linh",
    avatar: "NL",
    rating: 4,
    route: "Đà Nẵng → TP. Hồ Chí Minh",
    date: "21/09/2026",
    comment:
      "Website dễ dùng, chọn ghế nhanh và không bị rối. Nếu có thêm nhiều chương trình ưu đãi nữa thì sẽ rất tuyệt.",
  },
  {
    id: 4,
    name: "Phạm Gia Bảo",
    avatar: "GB",
    rating: 5,
    route: "TP. Hồ Chí Minh → Phú Quốc",
    date: "18/09/2026",
    comment:
      "Mình đặt vé lần đầu nhưng thao tác rất dễ hiểu. Các bước từ tìm chuyến bay đến chọn ghế đều rất thuận tiện.",
  },
];

function Promotions({ reviews = defaultReviews }) {
  // Chỉ hiện tối đa 4 đánh giá trên trang chủ
  const displayedReviews = reviews.slice(0, 4);

  return (
    <section className="customer-reviews">
      <div className="reviews-wrapper">
        {/* ===== TIÊU ĐỀ ===== */}
        <div className="reviews-header">
          <span className="reviews-small-title">TRẢI NGHIỆM KHÁCH HÀNG</span>

          <h2>Khách hàng nói gì về chúng tôi?</h2>

          <p>
            Những chia sẻ thực tế từ khách hàng sau khi đặt vé và trải nghiệm
            chuyến bay.
          </p>
        </div>

        {/* ===== DANH SÁCH ĐÁNH GIÁ ===== */}
        <div className="reviews-container">
          {displayedReviews.map((review) => (
            <div className="review-card" key={review.id}>
              {/* Dấu ngoặc trang trí */}
              <div className="quote-icon">“</div>

              {/* Sao */}
              <div
                className="review-stars"
                aria-label={`${review.rating} trên 5 sao`}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= review.rating ? "star active" : "star"}
                  >
                    ★
                  </span>
                ))}
              </div>

              {/* Nội dung đánh giá */}
              <p className="review-comment">{review.comment}</p>

              {/* Tuyến bay */}
              <div className="review-trip">
                <span className="plane-icon">✈</span>
                {review.route}
              </div>

              {/* Thông tin khách hàng */}
              <div className="review-user">
                <div className="review-avatar">{review.avatar}</div>

                <div className="review-user-info">
                  <h3>{review.name}</h3>

                  <div className="verified-review">
                    <span>✓</span>
                    Khách hàng đã đặt vé
                  </div>

                  <small>Đánh giá ngày {review.date}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Promotions;
