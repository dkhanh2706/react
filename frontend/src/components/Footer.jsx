import { useNavigate } from "react-router-dom";
import "../styles/Footer.css";

function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        {/* =================================================
            MAIN GRID
        ================================================= */}
        <div className="footer-main-grid">
          {/* BRAND */}
          <div className="footer-col-brand">
            <div
              className="footer-logo"
              role="button"
              tabIndex={0}
              onClick={() => navigate("/home")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/home")}
            >
              <span className="footer-logo-icon">✈</span>
              <span>Airline Booking</span>
            </div>

            <p className="footer-brand-desc">
              Hệ thống đặt vé máy bay trực tuyến thông minh, nhanh chóng và an toàn.
              Đồng hành cùng bạn trên mọi hành trình khám phá thế giới.
            </p>

            <div className="footer-social-links">
              <a href="#facebook" className="footer-social-btn" title="Facebook" aria-label="Facebook">
                f
              </a>
              <a href="#twitter" className="footer-social-btn" title="Twitter" aria-label="Twitter">
                𝕏
              </a>
              <a href="#instagram" className="footer-social-btn" title="Instagram" aria-label="Instagram">
                ig
              </a>
              <a href="#youtube" className="footer-social-btn" title="YouTube" aria-label="YouTube">
                ▶
              </a>
            </div>
          </div>

          {/* KHÁM PHÁ & ĐIỂM ĐẾN */}
          <div>
            <h4 className="footer-col-title">Khám phá</h4>
            <ul className="footer-links-list">
              <li>
                <span onClick={() => navigate("/home")}>Trang chủ</span>
              </li>
              <li>
                <span onClick={() => navigate("/destinations")}>Điểm đến nổi bật</span>
              </li>
              <li>
                <span onClick={() => navigate("/my-tickets")}>Quản lý vé máy bay</span>
              </li>
              <li>
                <span onClick={() => navigate("/destinations")}>Khuyến mãi & Ưu đãi</span>
              </li>
            </ul>
          </div>

          {/* CHÍNH SÁCH & HỖ TRỢ */}
          <div>
            <h4 className="footer-col-title">Hỗ trợ khách hàng</h4>
            <ul className="footer-links-list">
              <li>
                <span>Hướng dẫn đặt vé online</span>
              </li>
              <li>
                <span>Chính sách hoàn hủy vé</span>
              </li>
              <li>
                <span>Quy định hành lý</span>
              </li>
              <li>
                <span>Điều khoản & Bảo mật</span>
              </li>
              <li>
                <span>Câu hỏi thường gặp (FAQ)</span>
              </li>
            </ul>
          </div>

          {/* LIÊN HỆ & THANH TOÁN */}
          <div>
            <h4 className="footer-col-title">Liên hệ 24/7</h4>

            <div className="footer-contact-item">
              <span className="contact-icon">📞</span>
              <div>
                <strong>Hotline:</strong> 1900 6868
              </div>
            </div>

            <div className="footer-contact-item">
              <span className="contact-icon">✉</span>
              <div>
                <strong>Email:</strong> support@airlinebooking.vn
              </div>
            </div>

            <div className="footer-contact-item">
              <span className="contact-icon">📍</span>
              <div>Hà Nội & TP. Hồ Chí Minh, Việt Nam</div>
            </div>

            <div className="footer-payment-title">Thanh toán bảo mật</div>
            <div className="footer-payment-badges">
              <span className="payment-badge">VISA</span>
              <span className="payment-badge">Mastercard</span>
              <span className="payment-badge">VietQR</span>
              <span className="payment-badge">MoMo</span>
              <span className="payment-badge">ATM</span>
            </div>
          </div>
        </div>

        {/* =================================================
            BOTTOM BAR
        ================================================= */}
        <div className="footer-bottom-bar">
          <p>© {new Date().getFullYear()} Airline Booking. Toàn bộ quyền được bảo lưu.</p>

          <div className="footer-bottom-links">
            <span>Điều khoản dịch vụ</span>
            <span>·</span>
            <span>Chính sách riêng tư</span>
            <span>·</span>
            <span>Hợp tác đối tác</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
