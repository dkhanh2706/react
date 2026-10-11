import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

import "../styles/Payment.css";

// =====================================================
// FORMAT DATE
// =====================================================

const formatDate = (value) => {
  if (!value) return "---";

  const stringValue = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    const [year, month, day] = stringValue.split("-");

    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return stringValue;
  }

  return date.toLocaleDateString("vi-VN");
};

// =====================================================
// FORMAT TIME
// =====================================================

const formatTime = (value) => {
  if (!value) return "--:--";

  const stringValue = String(value);

  if (/^\d{2}:\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  if (/^\d{2}:\d{2}:\d{2}/.test(stringValue)) {
    return stringValue.slice(0, 5);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return stringValue;
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// =====================================================
// PAYMENT
// =====================================================

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  const data = location.state;

  const [paying, setPaying] = useState(false);
  const [mockPaying, setMockPaying] = useState(false);

  // ===================================================
  // CHECK LOGIN
  // ===================================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Vui lòng đăng nhập để thanh toán");

      navigate("/login", {
        replace: true,
      });
    }
  }, [navigate]);

  // ===================================================
  // KHÔNG CÓ DỮ LIỆU BOOKING
  // ===================================================

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

  // ===================================================
  // DATA
  // ===================================================

  const flight = data.flight || {};
  const seat = data.seat || {};
  const booking = data.booking || {};

  const totalPrice = Number(data.price || booking.total_price || 0);

  const holdExpiresAt = data.hold_expires_at || seat.hold_expires_at || null;

  // ===================================================
  // XỬ LÝ TOKEN HẾT HẠN
  // ===================================================

  const handleUnauthorized = () => {
    toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  // ===================================================
  // MOMO PAYMENT
  // ===================================================

  const handleMomoPayment = async () => {
    if (paying || mockPaying) {
      return;
    }

    const bookingId = booking?.id;

    if (!bookingId) {
      toast.error("Không tìm thấy mã đặt chỗ");
      return;
    }

    if (!totalPrice || totalPrice <= 0) {
      toast.error("Số tiền thanh toán không hợp lệ");
      return;
    }

    try {
      setPaying(true);

      /*
        Backend:
        POST /api/payments/momo/create

        Không gửi amount từ FE.
        Backend tự lấy total_price trong DB.
      */

      const response = await api.post("/payments/momo/create", {
        bookingId,
      });

      const payUrl = response.data?.payUrl;

      if (!payUrl) {
        console.error("MoMo response:", response.data);

        toast.error("Không nhận được đường dẫn thanh toán từ MoMo");

        return;
      }

      // =================================================
      // LƯU BOOKING ID
      // =================================================

      sessionStorage.setItem("momo_booking_id", String(bookingId));

      sessionStorage.setItem("momo_booking_code", booking.booking_code || "");

      // =================================================
      // CHUYỂN SANG MOMO SANDBOX
      // =================================================

      window.location.href = payUrl;
    } catch (error) {
      console.error("MOMO PAYMENT ERROR:", error.response?.data || error);

      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(
        error.response?.data?.message || "Không thể tạo thanh toán MoMo",
      );
    } finally {
      setPaying(false);
    }
  };

  // ===================================================
  // GIẢ LẬP THANH TOÁN THÀNH CÔNG
  // DÙNG CHO TEST / DEMO ĐỒ ÁN
  // ===================================================

  const handleMockPayment = async () => {
    if (paying || mockPaying) {
      return;
    }

    const bookingId = booking?.id;

    if (!bookingId) {
      toast.error("Không tìm thấy mã đặt chỗ");

      return;
    }

    if (!totalPrice || totalPrice <= 0) {
      toast.error("Số tiền thanh toán không hợp lệ");

      return;
    }

    try {
      setMockPaying(true);

      /*
        API mock payment đã có sẵn trong backend:

        POST /api/bookings/:bookingId/pay

        Backend sẽ:
        - booking -> CONFIRMED
        - seat -> BOOKED
        - payment -> SUCCESS
      */

      const response = await api.post(`/bookings/${bookingId}/pay`);

      toast.success(response.data?.message || "Giả lập thanh toán thành công!");

      // Lưu để có thể dùng nếu cần
      sessionStorage.setItem("last_booking_id", String(bookingId));

      // Sau khi thành công chuyển sang vé của tôi
      navigate("/my-tickets", {
        replace: true,
      });
    } catch (error) {
      console.error("MOCK PAYMENT ERROR:", error.response?.data || error);

      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(
        error.response?.data?.message || "Không thể giả lập thanh toán",
      );
    } finally {
      setMockPaying(false);
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="payment-page">
      <Header />

      <main className="payment-main">
        <div className="payment-inner">
          {/* =========================================
              STEP
          ========================================= */}

          <div className="payment-steps-bar">
            <div className="step-badge completed">
              <span>✓</span>
              Chọn chuyến bay
            </div>

            <div className="step-separator active" />

            <div className="step-badge completed">
              <span>✓</span>
              Chọn ghế ngồi
            </div>

            <div className="step-separator active" />

            <div className="step-badge current">
              <span>3</span>
              Thanh toán
            </div>
          </div>

          {/* =========================================
              TITLE
          ========================================= */}

          <div className="payment-header-title">
            <h1>Xác nhận & Thanh toán vé máy bay</h1>

            <p>
              Kiểm tra thông tin đặt vé trước khi chuyển sang cổng thanh toán
              MoMo.
            </p>
          </div>

          <div className="payment-grid">
            {/* =======================================
                LEFT
            ======================================= */}

            <div className="payment-left-column">
              <div className="payment-methods-card">
                <div className="payment-method-title">
                  <div>
                    <span className="payment-label">
                      PHƯƠNG THỨC THANH TOÁN
                    </span>

                    <h2>Thanh toán bằng MoMo</h2>
                  </div>

                  <div className="momo-logo-box">MoMo</div>
                </div>

                <p className="methods-subtitle">
                  Sau khi nhấn thanh toán, bạn sẽ được chuyển sang cổng MoMo
                  Sandbox để hoàn tất giao dịch.
                </p>

                {/* MOMO */}

                <div className="momo-method-selected">
                  <div className="momo-radio">
                    <span />
                  </div>

                  <div className="momo-method-icon">M</div>

                  <div className="momo-method-content">
                    <strong>Ví điện tử MoMo</strong>

                    <p>
                      Thanh toán trực tuyến an toàn qua cổng thanh toán MoMo.
                    </p>
                  </div>

                  <span className="method-tag recommend">Đã chọn</span>
                </div>

                {/* FLOW */}

                <div className="payment-flow-box">
                  <h3>Quy trình thanh toán</h3>

                  <div className="payment-flow-step">
                    <span>1</span>

                    <p>
                      Nhấn nút <strong>Thanh toán bằng MoMo</strong>
                    </p>
                  </div>

                  <div className="payment-flow-step">
                    <span>2</span>

                    <p>Hệ thống chuyển bạn sang trang thanh toán MoMo.</p>
                  </div>

                  <div className="payment-flow-step">
                    <span>3</span>

                    <p>Hoàn tất thanh toán và quay lại Airline Booking.</p>
                  </div>

                  <div className="payment-flow-step">
                    <span>4</span>

                    <p>
                      Backend xác nhận giao dịch qua MoMo IPN và phát hành vé.
                    </p>
                  </div>
                </div>

                {/* SANDBOX */}

                <div className="sandbox-notice">
                  <span className="notice-icon">🧪</span>

                  <div>
                    <strong>Môi trường MoMo Sandbox</strong>

                    <p>
                      Đây là môi trường kiểm thử tích hợp. Không phải giao dịch
                      thanh toán production.
                    </p>
                  </div>
                </div>

                {/* MOCK NOTICE */}

                <div className="mock-payment-notice">
                  <span className="notice-icon">🎓</span>

                  <div>
                    <strong>Chế độ demo đồ án</strong>

                    <p>
                      Nếu không sử dụng được ứng dụng MoMo Test, có thể sử dụng
                      nút giả lập thanh toán để kiểm tra toàn bộ luồng đặt vé.
                    </p>
                  </div>
                </div>

                {/* HOLD */}

                {holdExpiresAt && (
                  <div className="hold-payment-notice">
                    <span>⏳</span>

                    <div>
                      <strong>Ghế đang được giữ</strong>

                      <p>
                        Hoàn tất thanh toán trước khi thời gian giữ ghế kết
                        thúc.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* =======================================
                RIGHT
            ======================================= */}

            <div className="payment-right-column">
              <div className="order-summary-card">
                <h2>Tóm tắt vé máy bay</h2>

                {/* BOOKING */}

                <div className="booking-code-row">
                  <span>Mã đặt chỗ</span>

                  <strong>
                    {booking.booking_code || `#${booking.id || "---"}`}
                  </strong>
                </div>

                {/* FLIGHT */}

                <div className="summary-flight-block">
                  <div className="flight-title-row">
                    <span className="airline-name">
                      {flight.airline || "Hãng bay"}
                    </span>

                    <span className="flight-no">
                      Chuyến {flight.flight_number || "---"}
                    </span>
                  </div>

                  <div className="flight-route-display">
                    <div>
                      <strong>
                        {flight.from || flight.departure_code || "---"}
                      </strong>

                      <small>{formatTime(flight.departure_time)}</small>
                    </div>

                    <div className="route-arrow-icon">─── ✈ ───</div>

                    <div className="text-right">
                      <strong>
                        {flight.to || flight.arrival_code || "---"}
                      </strong>

                      <small>{formatTime(flight.arrival_time)}</small>
                    </div>
                  </div>

                  <div className="flight-meta-details">
                    <div>
                      <span>Ngày bay:</span>

                      <strong>{formatDate(flight.date)}</strong>
                    </div>

                    <div>
                      <span>Ghế:</span>

                      <strong className="seat-highlight">
                        {seat.seat_number || "---"} ({seat.class || "ECONOMY"})
                      </strong>
                    </div>
                  </div>
                </div>

                {/* PRICE */}

                <div className="price-calculation">
                  <div className="price-row">
                    <span>Giá vé</span>

                    <span>{totalPrice.toLocaleString("vi-VN")}đ</span>
                  </div>

                  <div className="price-row">
                    <span>Thuế, phí</span>

                    <span className="free-text">Đã bao gồm</span>
                  </div>

                  <div className="price-row">
                    <span>Phí thanh toán</span>

                    <span className="free-text">0đ</span>
                  </div>

                  <div className="price-row grand-total">
                    <span>Tổng thanh toán</span>

                    <strong>{totalPrice.toLocaleString("vi-VN")}đ</strong>
                  </div>
                </div>

                {/* =====================================
                    MOMO BUTTON
                ===================================== */}

                <button
                  type="button"
                  className="btn-submit-payment momo-button"
                  disabled={paying || mockPaying}
                  onClick={handleMomoPayment}
                >
                  {paying ? (
                    <>
                      <span className="payment-spinner" />
                      Đang kết nối MoMo...
                    </>
                  ) : (
                    <>
                      Thanh toán bằng MoMo
                      <span>{totalPrice.toLocaleString("vi-VN")}đ</span>
                    </>
                  )}
                </button>

                {/* =====================================
                    MOCK PAYMENT BUTTON
                ===================================== */}

                <button
                  type="button"
                  className="btn-mock-payment"
                  disabled={paying || mockPaying}
                  onClick={handleMockPayment}
                >
                  {mockPaying ? (
                    <>
                      <span className="mock-spinner" />
                      Đang giả lập thanh toán...
                    </>
                  ) : (
                    <>
                      <span>🧪</span>
                      Giả lập thanh toán thành công
                    </>
                  )}
                </button>

                {/* BACK */}

                <button
                  type="button"
                  className="btn-cancel-payment"
                  disabled={paying || mockPaying}
                  onClick={() => navigate(-1)}
                >
                  ← Quay lại thay đổi ghế
                </button>

                <div className="security-guarantee">
                  <span>🔒</span>

                  <small>
                    Thông tin thanh toán được xử lý bởi backend và cổng MoMo.
                  </small>
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
