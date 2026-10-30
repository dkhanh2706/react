import PaymentSummary from "../components/payment/PaymentSummary.jsx";
import PaymentMethods from "../components/payment/PaymentMethods.jsx";
import PaymentServices from "../components/payment/PaymentServices.jsx";
import PaymentPassengerCard from "../components/payment/PaymentPassengerCard.jsx";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";
import "../styles/Payment.css";
function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingId = params.get("bookingId") || location.state?.booking?.id;
  const [checkout, setCheckout] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const data = String(checkout?.booking?.id) === String(bookingId) ? checkout : null;
  useEffect(() => {
    if (!bookingId) return;
    let active = true;
    api.get(`/bookings/${bookingId}/checkout`).then(({
      data
    }) => {
      if (active) {
        setCheckout(data);
        setCheckoutError("");
      }
    }).catch(error => {
      if (active) setCheckoutError(error.response?.data?.message || "Không tải được thông tin đơn đặt vé");
    });
    return () => {
      active = false;
    };
  }, [bookingId]);
  const [paying, setPaying] = useState(false);
  const [mockPaying, setMockPaying] = useState(false);
  const [demoEnabled, setDemoEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    api.get("/payments/config").then(r => {
      if (active) setDemoEnabled(r.data.demo_payments_enabled === true);
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để thanh toán");
      navigate("/login", {
        replace: true
      });
    }
  }, [navigate]);
  if (!data) {
    return <div className="payment-page">
        <Header />

        <main className="payment-main">
          <div className="payment-empty-box">
            <span className="payment-empty-icon">⚠️</span>

            <h2>{checkoutError || (bookingId ? "Đang tải thông tin thanh toán…" : "Không tìm thấy thông tin thanh toán")}</h2>

            <p>{bookingId && !checkoutError ? "Hệ thống đang kiểm tra đơn và thời gian giữ ghế." : "Vui lòng kiểm tra trạng thái đơn trước khi thanh toán lại."}</p>

            <button type="button" className="btn-pay-return" onClick={() => navigate("/my-orders")}>
              Xem đơn đặt vé
            </button>
          </div>
        </main>

        <Footer />
      </div>;
  }
  const flight = data.flight || {};
  const seat = data.seat || {};
  const passenger = data.passenger || {};
  const services = data.services || {};
  const pricing = data.pricing || {};
  const booking = data.booking || {};
  const totalPrice = Number(booking.total_price || data.price || pricing.total_price || 0);
  const basePrice = Number(pricing.base_price || flight.price || 0);
  const seatSurcharge = Number(pricing.seat_surcharge || 0);
  const baggagePrice = Number(pricing.baggage_price || services.baggage_price || 0);
  const mealPrice = Number(pricing.meal_price || services.meal_price || 0);
  const insurancePrice = Number(pricing.insurance_price || services.insurance_price || 0);
  const holdExpiresAt = data.hold_expires_at || seat.hold_expires_at || null;
  const handleUnauthorized = () => {
    toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", {
      replace: true
    });
  };
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
      const response = await api.post("/payments/momo/create", {
        bookingId
      });
      const payUrl = response.data?.payUrl;
      if (!payUrl) {
        console.error("MoMo response:", response.data);
        toast.error("Không nhận được đường dẫn thanh toán từ MoMo");
        return;
      }
      sessionStorage.setItem("momo_booking_id", String(bookingId));
      sessionStorage.setItem("momo_booking_code", booking.booking_code || "");
      window.location.href = payUrl;
    } catch (error) {
      console.error("MOMO PAYMENT ERROR:", error.response?.data || error);
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      toast.error(error.response?.data?.message || "Không thể tạo thanh toán MoMo");
    } finally {
      setPaying(false);
    }
  };
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
      const response = await api.post(`/bookings/${bookingId}/pay`);
      toast.success(response.data?.message || "Giả lập thanh toán thành công!");
      sessionStorage.setItem("last_booking_id", String(bookingId));
      navigate(`/payment-result?bookingId=${bookingId}`, {
        replace: true
      });
    } catch (error) {
      console.error("MOCK PAYMENT ERROR:", error.response?.data || error);
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      toast.error(error.response?.data?.message || "Không thể giả lập thanh toán");
    } finally {
      setMockPaying(false);
    }
  };
  return <div className="payment-page">
      <Header />

      <main className="payment-main">
        <div className="payment-inner">
          {/* STEP */}

          <div className="payment-steps-bar">
            <div className="step-badge completed">
              <span>✓</span>
              Chọn chuyến bay
            </div>

            <div className="step-separator active" />

            <div className="step-badge completed">
              <span>✓</span>
              Thông tin hành khách
            </div>

            <div className="step-separator active" />

            <div className="step-badge completed">
              <span>✓</span>
              Chọn ghế
            </div>

            <div className="step-separator active" />

            <div className="step-badge current">
              <span>4</span>
              Thanh toán
            </div>
          </div>

          {/* TITLE */}

          <div className="payment-header-title">
            <h1>Xác nhận & Thanh toán vé máy bay</h1>

            <p>
              Kiểm tra thông tin hành khách, chuyến bay và dịch vụ trước khi
              thanh toán.
            </p>
          </div>

          <div className="payment-grid">
            {/* LEFT */}

            <div className="payment-left-column">
              {/* PASSENGER */}

              <PaymentPassengerCard passenger={passenger} />

              {/* SERVICES */}

              <PaymentServices services={services} />

              {/* PAYMENT METHOD */}

              <PaymentMethods demoEnabled={demoEnabled} holdExpiresAt={holdExpiresAt} />
            </div>

            {/* RIGHT */}

            <div className="payment-right-column">
              <PaymentSummary booking={booking} flight={flight} seat={seat} basePrice={basePrice} seatSurcharge={seatSurcharge} baggagePrice={baggagePrice} services={services} mealPrice={mealPrice} insurancePrice={insurancePrice} totalPrice={totalPrice} data={data} navigate={navigate} demoEnabled={demoEnabled} paying={paying} mockPaying={mockPaying} handleMockPayment={handleMockPayment} handleMomoPayment={handleMomoPayment} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>;
}
export default Payment;
