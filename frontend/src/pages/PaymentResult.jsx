import { formatDate, formatNumber } from "../utils/format.js";

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";
import { Check, Plane, Clock3 } from "lucide-react";
import { airportName } from "../utils/airportNames";
import "../styles/PaymentResult.css";

export default function PaymentResult() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderBooking = params.get("orderId")?.match(/^BK_(\d+)_/)?.[1];
  const directBooking = params.get("bookingId");
  const bookingId = (/^[1-9]\d*$/.test(directBooking || "") ? directBooking : null) || orderBooking || sessionStorage.getItem("momo_booking_id");
  const [result, setResult] = useState(null);
  const [failure, setFailure] = useState(null);
  const data = String(result?.booking?.id) === String(bookingId) ? result : null;
  const error = failure?.id === String(bookingId) ? failure.message : "";
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!bookingId) return;
    let active = true;
    let timer;
    let attempts = 0;
    async function check() {
      try {
        const response = await api.get(`/payments/booking/${bookingId}/status`);
        if (!active) return;
        setResult(response.data);
        setFailure(null);
        attempts += 1;
        if (["PENDING", "EXPIRED"].includes(response.data.booking.status) && attempts < 30) timer = setTimeout(check, 2000);
      } catch (err) { if (active) setFailure({ id: String(bookingId), message: err.response?.data?.message || "Chưa kiểm tra được giao dịch" }); }
    }
    check();
    return () => { active = false; clearTimeout(timer); };
  }, [bookingId, refresh]);
  const success = !error && data?.booking.status === "CONFIRMED";
  const demoSuccess = success && data.payments.some(p => p.method === "MOCK" && p.status === "SUCCESS");
  const review = data?.reviews.some(r => r.status === "OPEN");
  const refunded = data?.payments.some(p => p.status === "REFUNDED");
  const failed = data?.payments.length > 0 && data.payments.every(p => p.status === "FAILED");
  const canContinue = !error && !review && data?.booking.status === "PENDING";
  const title = !bookingId ? "Không xác định được đơn đặt vé" : error || (!data ? "Đang kiểm tra thanh toán…" : review ? "Giao dịch cần đối soát" : success ? "Thanh toán thành công" : refunded ? "Đã ghi nhận hoàn tiền" : data.booking.status === "EXPIRED" ? "Đã hết hạn giữ ghế" : data.booking.status === "CANCELLED" ? "Đơn đã hủy" : failed ? "Thanh toán chưa thành công" : "Đang chờ xác nhận thanh toán");
  return <div className="payment-result-page"><Header /><main className="payment-result-main">
    <div className={`payment-result-card ${success ? "success" : "failed"}`}>
      <div className="result-icon">{success ? <Check size={36} /> : <Clock3 size={32} />}</div>
      <span className="result-status">{success ? "HÀNH TRÌNH ĐÃ SẴN SÀNG" : "TRẠNG THÁI GIAO DỊCH"}</span>
      <h1>{title}</h1>
      {success && <p className="result-description">Đơn đã được thanh toán, ghế đã được đặt và vé đã được xác nhận. Bạn có thể xem hành trình trong Vé của tôi.</p>}
      {data && <div className="result-boarding-pass">
        <div className="result-pass-header"><span><Plane size={18} /> {data.booking.airline_name || "Thông tin đặt vé"}</span><strong>{data.booking.flight_number_snapshot}</strong></div>
        <div className="result-pass-route"><div><small>ĐIỂM ĐI</small><strong>{airportName(data.booking.departure_place)}</strong><span>{data.booking.departure_time_text || "—"}</span></div><Plane aria-hidden="true" /><div><small>ĐIỂM ĐẾN</small><strong>{airportName(data.booking.arrival_place)}</strong><span>{data.booking.arrival_time_text || "—"}</span></div></div>
        <div className="result-pass-meta"><div><small>Ngày bay</small><strong>{formatDate(data.booking.flight_date, { fallback: "—" })}</strong></div><div><small>Ghế ngồi</small><strong>{data.booking.seat_number_snapshot || "—"}</strong></div><div><small>Số tiền đơn</small><strong>{formatNumber(data.booking.total_price)}đ</strong></div></div>
        <div className="result-pass-code"><small>MÃ ĐẶT CHỖ</small><strong>{data.booking.booking_code}</strong></div>
      </div>}
      {demoSuccess && !review && <p>Phương thức: Demo. Hệ thống đã ghi nhận đầy đủ trạng thái đã thanh toán; không cần thanh toán lại đơn này. Demo không trừ tiền qua ví hoặc ngân hàng.</p>}
      {review && <p>Hệ thống đã ghi nhận khoản thanh toán. Admin sẽ kiểm tra và xử lý cấp vé hoặc hoàn tiền theo hồ sơ đối soát.</p>}
      {!success && !review && <p>Thông tin được cập nhật từ hệ thống đặt vé. Nếu bạn đã trả tiền, hãy kiểm tra lại trạng thái trước khi thanh toán thêm.</p>}
      <div className="result-actions">
        {success ? <button className="result-primary-button" onClick={() => navigate("/my-tickets")}>Xem vé của tôi</button>
          : canContinue ? <button className="result-primary-button" onClick={() => navigate(`/payment?bookingId=${bookingId}`)}>Tiếp tục thanh toán</button>
          : <button className="result-primary-button" onClick={() => navigate("/my-orders")}>Xem đơn đặt vé</button>}
        <button className="result-secondary-button" onClick={() => navigate("/my-orders")}>Lịch sử đơn</button>
        {!success && !canContinue && !review && <button className="result-secondary-button" onClick={() => navigate("/destinations")}>Tìm chuyến khác</button>}
        <button className="result-secondary-button" onClick={() => setRefresh(n => n+1)}>Kiểm tra lại</button>
      </div>
    </div></main><Footer /></div>;
}
