import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Payment.css";

function Payment() {
  const location = useLocation();

  const navigate = useNavigate();

  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div>
        <h2>Không có thông tin thanh toán</h2>

        <button onClick={() => navigate("/home")}>Về trang chủ</button>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <h1>Thanh toán vé máy bay</h1>

      <div className="payment-card">
        <h2>Thông tin đặt vé</h2>

        <p>
          Mã đặt chỗ:
          <b>{booking.booking.booking_code}</b>
        </p>

        <p>
          Tổng tiền:
          <b>{Number(booking.booking.total_price).toLocaleString("vi-VN")}đ</b>
        </p>

        <h3>Phương thức thanh toán</h3>

        <button className="pay-method">💳 Thanh toán thẻ</button>

        <button className="pay-method">🏦 Chuyển khoản ngân hàng</button>

        <button className="pay-method">📱 Ví điện tử</button>

        <button className="confirm-pay">Xác nhận thanh toán</button>
      </div>
    </div>
  );
}

export default Payment;
