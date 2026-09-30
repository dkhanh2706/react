import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import "../styles/Payment.css";

function Payment() {
  const location = useLocation();

  const navigate = useNavigate();

  const data = location.state;

  // ==========================
  // KIỂM TRA ĐĂNG NHẬP
  // ==========================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Vui lòng đăng nhập để thanh toán");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    }
  }, [navigate]);

  if (!data) {
    return (
      <div>
        <h2>Không có thông tin thanh toán</h2>

        <button onClick={() => navigate("/home")}>Về trang chủ</button>
      </div>
    );
  }

  const handlePayment = () => {
    toast.success("Thanh toán thành công");

    setTimeout(() => {
      navigate("/home");
    }, 1200);
  };

  return (
    <div className="payment-container">
      <div className="payment-card">
        <h1>Thanh toán vé máy bay</h1>

        <h2>Thông tin chuyến bay</h2>

        <p>
          Hãng bay:
          <b>{data.flight.airline}</b>
        </p>

        <p>
          Chuyến:
          <b>
            {data.flight.from}→{data.flight.to}
          </b>
        </p>

        <p>
          Mã chuyến:
          <b>{data.flight.flight_number}</b>
        </p>

        <hr />

        <h2>Thông tin ghế</h2>

        <p>
          Ghế:
          <b>{data.seat.seat_number}</b>
        </p>

        <p>
          Hạng:
          <b>{data.seat.class}</b>
        </p>

        <h2>
          Tổng tiền:
          {Number(data.price).toLocaleString("vi-VN")}đ
        </h2>

        <button className="confirm-pay" onClick={handlePayment}>
          Xác nhận thanh toán
        </button>

        <button onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    </div>
  );
}

export default Payment;
