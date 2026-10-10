import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

import "../styles/Payment.css";

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  const data = location.state;
  const [paying, setPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("qr");

  // CHECK LOGIN
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để thanh toán");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  if (!data) {
    return (
      <div className="payment-page">
        <Header />
        <main className="payment-main">
          <div className="payment-empty-box">
            <span className="payment-empty-icon">⚠️</span>
            <h2>Không tìm thấy thông tin thanh toán</h2>
            <p>Phiên giao dịch có thể đã hết hạn hoặc chưa được tạo.</p>
            <button
              type="button"
              className="btn-pay-return"
              onClick={() => navigate("/home")}
            >
              Về trang chủ
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // XÁC NHẬN THANH TOÁN
  const handlePayment = async () => {
    if (paying) return;

    const bookingId = data.booking?.id;
    if (!bookingId) {
      toast.error("Không tìm thấy mã đặt chỗ (booking ID)");
      return;
    }

    try {
      setPaying(true);
      const response = await api.post(`/bookings/${bookingId}/pay`);
      toast.success(response.data?.message || "Thanh toán vé thành công!");
      navigate("/my-tickets", { replace: true });
    } catch (error) {
      console.error("PAYMENT ERROR:", error.response?.data || error);
      toast.error(
        error.response?.data?.message || "Không thể hoàn thành giao dịch"
      );
    } finally {
      setPaying(false);
    }
  };

  const flight = data.flight || {};
  const seat = data.seat || {};
  const totalPrice = Number(data.price || 0);

  return (
    <div className="payment-page">
      <Header />

      <main className="payment-main">
        <div className="payment-inner">
          {/* STEP INDICATOR */}
          <div className="payment-steps-bar">
            <div className="step-badge completed">
              <span>✓</span> Chọn chuyến bay
            </div>
            <div className="step-separator active" />
            <div className="step-badge completed">
              <span>✓</span> Chọn ghế ngồi
            </div>
            <div className="step-separator active" />
            <div className="step-badge current">
              <span>3</span> Thanh toán an toàn
            </div>
          </div>

          <div className="payment-header-title">
            <h1>Xác nhận & Thanh toán vé máy bay</h1>
            <p>Vui lòng kiểm tra lại thông tin hành trình và chọn phương thức thanh toán</p>
          </div>

          <div className="payment-grid">
            {/* CỘT TRÁI: CHỌN PHƯƠNG THỨC THANH TOÁN */}
            <div className="payment-left-column">
              <div className="payment-methods-card">
                <h2>Chọn phương thức thanh toán</h2>
                <p className="methods-subtitle">Mọi giao dịch đều được mã hóa bảo mật 256-bit SSL</p>

                <div className="methods-list">
                  {/* VIETQR */}
                  <label
                    className={`method-option ${selectedMethod === "qr" ? "active" : ""}`}
                    onClick={() => setSelectedMethod("qr")}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="qr"
                      checked={selectedMethod === "qr"}
                      onChange={() => setSelectedMethod("qr")}
                    />
                    <div className="method-info">
                      <div className="method-top">
                        <strong>Chuyển khoản VietQR tức thì</strong>
                        <span className="method-tag recommend">Khuyên dùng</span>
                      </div>
                      <p>Quét mã QR qua ứng dụng ngân hàng bất kỳ, xác nhận tự động trong 30 giây</p>
                    </div>
                    <span className="method-icon-glyph">📲</span>
                  </label>

                  {/* THẺ TÍN DỤNG QUỐC TẾ */}
                  <label
                    className={`method-option ${selectedMethod === "card" ? "active" : ""}`}
                    onClick={() => setSelectedMethod("card")}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={selectedMethod === "card"}
                      onChange={() => setSelectedMethod("card")}
                    />
                    <div className="method-info">
                      <div className="method-top">
                        <strong>Thẻ thanh toán Quốc tế (Visa, Mastercard, JCB)</strong>
                      </div>
                      <p>Hỗ trợ thẻ tín dụng và thẻ ghi nợ quốc tế phát hành toàn cầu</p>
                    </div>
                    <span className="method-icon-glyph">💳</span>
                  </label>

                  {/* VÍ ĐIỆN TỬ */}
                  <label
                    className={`method-option ${selectedMethod === "ewallet" ? "active" : ""}`}
                    onClick={() => setSelectedMethod("ewallet")}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="ewallet"
                      checked={selectedMethod === "ewallet"}
                      onChange={() => setSelectedMethod("ewallet")}
                    />
                    <div className="method-info">
                      <div className="method-top">
                        <strong>Ví điện tử (MoMo / ZaloPay / ShopeePay)</strong>
                      </div>
                      <p>Thanh toán nhanh chóng liên kết qua ví điện tử thông minh</p>
                    </div>
                    <span className="method-icon-glyph">👛</span>
                  </label>

                  {/* ATM NỘI ĐỊA */}
                  <label
                    className={`method-option ${selectedMethod === "atm" ? "active" : ""}`}
                    onClick={() => setSelectedMethod("atm")}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="atm"
                      checked={selectedMethod === "atm"}
                      onChange={() => setSelectedMethod("atm")}
                    />
                    <div className="method-info">
                      <div className="method-top">
                        <strong>Thẻ ATM Nội địa (Internet Banking)</strong>
                      </div>
                      <p>Hỗ trợ hơn 35+ ngân hàng thành viên NAPAS tại Việt Nam</p>
                    </div>
                    <span className="method-icon-glyph">🏛️</span>
                  </label>
                </div>

                <div className="sandbox-notice">
                  <span className="notice-icon">ℹ️</span>
                  <div>
                    <strong>Chế độ mô phỏng thanh toán (Sandbox Demo)</strong>
                    <p>Nhấp vào nút "Xác nhận thanh toán ngay" bên dưới để hoàn tất đặt vé mà không bị trừ tiền thật.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG & NÚT THANH TOÁN */}
            <div className="payment-right-column">
              <div className="order-summary-card">
                <h2>Tóm tắt vé máy bay</h2>

                <div className="summary-flight-block">
                  <div className="flight-title-row">
                    <span className="airline-name">{flight.airline || "Hãng bay"}</span>
                    <span className="flight-no">Chuyến {flight.flight_number || "---"}</span>
                  </div>

                  <div className="flight-route-display">
                    <div>
                      <strong>{flight.from || flight.departure_code || "---"}</strong>
                      <small>{flight.departure_time || "--:--"}</small>
                    </div>
                    <div className="route-arrow-icon">✈</div>
                    <div className="text-right">
                      <strong>{flight.to || flight.arrival_code || "---"}</strong>
                      <small>{flight.arrival_time || "--:--"}</small>
                    </div>
                  </div>

                  <div className="flight-meta-details">
                    <div>
                      <span>Ngày bay:</span>
                      <strong>{flight.date || "---"}</strong>
                    </div>
                    <div>
                      <span>Ghế đã chọn:</span>
                      <strong className="seat-highlight">
                        {seat.seat_number || "---"} ({seat.class || "ECONOMY"})
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="price-calculation">
                  <div className="price-row">
                    <span>Giá vé người lớn</span>
                    <span>{totalPrice.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="price-row">
                    <span>Thuế, phí sân bay</span>
                    <span className="free-text">Đã bao gồm</span>
                  </div>
                  <div className="price-row">
                    <span>Phí dịch vụ xuất vé</span>
                    <span className="free-text">Miễn phí</span>
                  </div>
                  <div className="price-row grand-total">
                    <span>Tổng số tiền thanh toán</span>
                    <strong>{totalPrice.toLocaleString("vi-VN")}đ</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-submit-payment"
                  disabled={paying}
                  onClick={handlePayment}
                >
                  {paying ? "Đang xử lý thanh toán..." : `Xác nhận thanh toán ngay (${totalPrice.toLocaleString("vi-VN")}đ)`}
                </button>

                <button
                  type="button"
                  className="btn-cancel-payment"
                  disabled={paying}
                  onClick={() => navigate(-1)}
                >
                  ← Quay lại thay đổi ghế
                </button>

                <div className="security-guarantee">
                  <span>🔒</span>
                  <small>Bảo mật giao dịch bằng chuẩn PCI-DSS Level 1 & SSL</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Payment;
