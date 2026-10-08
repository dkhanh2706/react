import { useEffect, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import api from "../api/axios";

import "../styles/Payment.css";

function Payment() {
  const location = useLocation();

  const navigate = useNavigate();

  const data = location.state;

  const [paying, setPaying] = useState(false);

  // =====================================================
  // KIỂM TRA ĐĂNG NHẬP
  // =====================================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Vui lòng đăng nhập để thanh toán");

      navigate("/login", {
        replace: true,
      });
    }
  }, [navigate]);

  // =====================================================
  // KHÔNG CÓ DATA
  // =====================================================

  if (!data) {
    return (
      <div className="payment-container">
        <div className="payment-card">
          <h2>Không có thông tin thanh toán</h2>

          <button type="button" onClick={() => navigate("/home")}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // XÁC NHẬN THANH TOÁN
  // =====================================================

  const handlePayment = async () => {
    if (paying) {
      return;
    }

    const bookingId = data.booking?.id;

    if (!bookingId) {
      toast.error("Không tìm thấy mã booking");

      return;
    }

    try {
      setPaying(true);

      console.log("PAY BOOKING ID:", bookingId);

      const response = await api.post(`/bookings/${bookingId}/pay`);

      console.log("PAYMENT SUCCESS:", response.data);

      toast.success(response.data?.message || "Đặt vé thành công");

      // ==========================================
      // THANH TOÁN XONG -> TRANG VÉ
      // ==========================================

      navigate("/my-tickets", {
        replace: true,
      });
    } catch (error) {
      console.error("PAYMENT ERROR:", error.response?.data || error);

      toast.error(
        error.response?.data?.message || "Không thể hoàn thành đặt vé",
      );
    } finally {
      setPaying(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="payment-container">
      <div className="payment-card">
        <h1>Thanh toán vé máy bay</h1>

        {/* ==========================================
            CHUYẾN BAY
        ========================================== */}

        <h2>Thông tin chuyến bay</h2>

        <p>
          Hãng bay: <b>{data.flight?.airline}</b>
        </p>

        <p>
          Chuyến:{" "}
          <b>
            {data.flight?.from}
            {" → "}
            {data.flight?.to}
          </b>
        </p>

        <p>
          Mã chuyến: <b>{data.flight?.flight_number}</b>
        </p>

        <p>
          Ngày bay: <b>{data.flight?.date}</b>
        </p>

        <p>
          Giờ bay:{" "}
          <b>
            {data.flight?.departure_time}

            {data.flight?.arrival_time && (
              <>
                {" → "}
                {data.flight.arrival_time}
              </>
            )}
          </b>
        </p>

        <hr />

        {/* ==========================================
            GHẾ
        ========================================== */}

        <h2>Thông tin ghế</h2>

        <p>
          Ghế: <b>{data.seat?.seat_number}</b>
        </p>

        <p>
          Hạng: <b>{data.seat?.class}</b>
        </p>

        <hr />

        {/* ==========================================
            GIÁ
        ========================================== */}

        <h2>Tổng tiền: {Number(data.price || 0).toLocaleString("vi-VN")}đ</h2>

        <p>Đây là thanh toán giả lập. Bấm xác nhận để hoàn thành đặt vé.</p>

        {/* ==========================================
            BUTTON
        ========================================== */}

        <button
          type="button"
          className="confirm-pay"
          disabled={paying}
          onClick={handlePayment}
        >
          {paying ? "Đang xử lý..." : "Xác nhận thanh toán"}
        </button>

        <button type="button" disabled={paying} onClick={() => navigate(-1)}>
          Quay lại
        </button>
      </div>
    </div>
  );
}

export default Payment;
