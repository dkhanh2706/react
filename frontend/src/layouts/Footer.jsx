import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FooterHelpDialog from "../components/common/FooterHelpDialog";
import { footerHelpTopics, informationLinks, supportLinks } from "../data/footerHelp";
import "../styles/Footer.css";

function Footer() {
  const navigate = useNavigate();
  const [helpTopic, setHelpTopic] = useState(null);

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
              <span>DAMH Shop</span>
            </div>

            <p className="footer-brand-desc">
              Hệ thống đặt vé máy bay trực tuyến thông minh, nhanh chóng và an toàn.
              Đồng hành cùng bạn trên mọi hành trình khám phá thế giới.
            </p>

            <div className="footer-social-links">
              <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Facebook" aria-label="Facebook">
                f
              </a>
              <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="X" aria-label="X">
                𝕏
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Instagram" aria-label="Instagram">
                ig
              </a>
              <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="YouTube" aria-label="YouTube">
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
                <span onClick={() => navigate("/my-orders")}>Đơn đặt vé của tôi</span>
              </li>
            </ul>
          </div>

          {/* CHÍNH SÁCH & HỖ TRỢ */}
          <div>
            <h4 className="footer-col-title">Hỗ trợ khách hàng</h4>
            <ul className="footer-links-list">
              {supportLinks.map((link) => <li key={link.id}>
                <button type="button" aria-haspopup="dialog" onClick={() => setHelpTopic(link.id)}>{link.label}</button>
              </li>)}
            </ul>
          </div>

          {/* LIÊN HỆ */}
          <div>
            <h4 className="footer-col-title">Liên hệ 24/7</h4>

            <div className="footer-contact-item">
              <span className="contact-icon">📞</span>
              <div>
                <strong>Hotline:</strong> 0963176945
              </div>
            </div>

            <div className="footer-contact-item">
              <span className="contact-icon">✉</span>
              <div>
                <strong>Email:</strong> duykhanh1911205@gmail.com
              </div>
            </div>

            <div className="footer-contact-item">
              <span className="contact-icon">📍</span>
              <div><strong>Địa chỉ:</strong> Hồ Chí Minh</div>
            </div>
          </div>
        </div>

        {/* =================================================
            BOTTOM BAR
        ================================================= */}
        <div className="footer-bottom-bar">
          <p>© {new Date().getFullYear()} DAMH Shop. Toàn bộ quyền được bảo lưu.</p>

          <div className="footer-bottom-links">
            {informationLinks.map((link, index) => <div className="footer-bottom-link-item" key={link.id}>
              {index > 0 && <span aria-hidden="true">·</span>}
              <button type="button" aria-haspopup="dialog" onClick={() => setHelpTopic(link.id)}>{link.label}</button>
            </div>)}
          </div>
        </div>
      </div>
      {helpTopic && <FooterHelpDialog topic={footerHelpTopics[helpTopic]} onDismiss={() => setHelpTopic(null)} />}
    </footer>
  );
}

export default Footer;
