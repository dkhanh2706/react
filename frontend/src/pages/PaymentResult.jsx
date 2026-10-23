import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Check, Plane, Clock3 } from "lucide-react";
import { airportName } from "../utils/airportNames";
import "../styles/PaymentResult.css";

export default function PaymentResult() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderBooking = params.get("orderId")?.match(/^BK_(\d+)_/)?.[1];
  const directBooking = params.get("bookingId");
  const bookingId = (/^[1-9]\d*$/.test(directBooking || "") ? directBooking : null) || orderBooking || sessionStorage.getItem("momo_booking_id");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
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
        setData(response.data);
        setError("");
        attempts += 1;
        if (["PENDING", "EXPIRED"].includes(response.data.booking.status) && attempts < 30) timer = setTimeout(check, 2000);
      } catch (err) { if (active) setError(err.response?.data?.message || "Chưa kiểm tra được giao dịch"); }
    }
    check();
    return () => { active = false; clearTimeout(timer); };
  }, [bookingId, refresh]);
  const success = !error && data?.booking.status === "CONFIRMED";
  const demoSuccess = success && data.payments.some(p => p.method === "MOCK" && p.status === "SUCCESS");
  const review = data?.reviews.some(r => r.status === "OPEN");
  const refunded = data?.payments.some(p => p.status === "REFUNDED");
  const failed = data?.payments.length > 0 && data.payments.every(p => p.status === "FAILED");
  const title = !bookingId ? "Không xác định được đơn đặt vé" : error || (!data ? "Đang kiểm tra thanh toán…" : review ? "Giao dịch cần đối soát" : demoSuccess ? "Thanh toán giả lập thành công" : success ? "Vé đã được xác nhận" : refunded ? "Đã ghi nhận hoàn tiền" : data.booking.status === "EXPIRED" ? "Đã hết hạn giữ ghế" : data.booking.status === "CANCELLED" ? "Đơn đã hủy" : failed ? "Thanh toán chưa thành công" : "Đang chờ xác nhận thanh toán");
  return <div className="payment-result-page"><Header /><main className="payment-result-main">
    <div className={`payment-result-card ${success ? "success" : "failed"}`}>
      <div className="result-icon">{success ? <Check size={36} /> : <Clock3 size={32} />}</div>
      <span className="result-status">{success ? "HÀNH TRÌNH ĐÃ SẴN SÀNG" : "TRẠNG THÁI GIAO DỊCH"}</span>
      <h1>{title}</h1>
      {success && <p className="result-description">Cảm ơn bạn đã đặt vé. Thông tin hành trình của bạn đã được lưu trong Vé của tôi.</p>}
      {data && <div className="result-boarding-pass">
        <div className="result-pass-header"><span><Plane size={18} /> {data.booking.airline_name || "Thông tin đặt vé"}</span><strong>{data.booking.flight_number_snapshot}</strong></div>
        <div className="result-pass-route"><div><small>ĐIỂM ĐI</small><strong>{airportName(data.booking.departure_place)}</strong><span>{data.booking.departure_time_text || "—"}</span></div><Plane aria-hidden="true" /><div><small>ĐIỂM ĐẾN</small><strong>{airportName(data.booking.arrival_place)}</strong><span>{data.booking.arrival_time_text || "—"}</span></div></div>
        <div className="result-pass-meta"><div><small>Ngày bay</small><strong>{data.booking.flight_date ? new Date(`${String(data.booking.flight_date).slice(0, 10)}T00:00:00`).toLocaleDateString("vi-VN") : "—"}</strong></div><div><small>Ghế ngồi</small><strong>{data.booking.seat_number_snapshot || "—"}</strong></div><div><small>Số tiền đơn</small><strong>{Number(data.booking.total_price).toLocaleString("vi-VN")}đ</strong></div></div>
        <div className="result-pass-code"><small>MÃ ĐẶT CHỖ</small><strong>{data.booking.booking_code}</strong></div>
      </div>}
      {demoSuccess && !review && <p>Vé và ghế đã được xác nhận trong chế độ demo. Không trừ tiền thật. Bạn có thể xem vé trong “Vé của tôi”.</p>}
      {review && <p>Hệ thống đã ghi nhận khoản thanh toán. Admin sẽ kiểm tra và xử lý cấp vé hoặc hoàn tiền theo hồ sơ đối soát.</p>}
      {!success && !review && <p>Thông tin được cập nhật từ hệ thống đặt vé. Nếu bạn đã trả tiền, hãy kiểm tra lại trạng thái trước khi thanh toán thêm.</p>}
      <div className="result-actions"><button className="result-primary-button" onClick={() => navigate("/my-tickets")}>Xem vé của tôi</button><button className="result-secondary-button" onClick={() => navigate("/home")}>Trang chủ</button><button className="result-secondary-button" onClick={() => setRefresh(n => n+1)}>Kiểm tra lại</button></div>
    </div></main><Footer /></div>;
}
