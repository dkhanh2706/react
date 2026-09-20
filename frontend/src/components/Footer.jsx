function Footer() {
  return (
    <footer className="footer">
      <div>
        <h3>Airline Booking</h3>

        <p>Nền tảng đặt vé máy bay trực tuyến</p>
      </div>

      <div>
        <h3>Chính sách</h3>

        <p>Hoàn hủy vé</p>

        <p>Bảo mật</p>

        <p>Điều khoản</p>
      </div>

      <div>
        <h3>Hỗ trợ</h3>

        <p>Hướng dẫn đặt vé</p>

        <p>Hotline: 1900 xxxx</p>

        <p>Email hỗ trợ</p>
      </div>

      <div>
        <h3>Thanh toán</h3>

        <p>Visa / Mastercard</p>

        <p>Ví điện tử</p>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Airline Booking. Bay cùng chúng tôi.</p>
      </div>
    </footer>
  );
}

export default Footer;
