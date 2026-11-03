import useSeatBooking from "../hooks/useSeatBooking.js";
import BookingPriceSummary from "../components/booking/BookingPriceSummary.jsx";
import BookingPassengerCard from "../components/booking/BookingPassengerCard.jsx";
import BookingFlightCard from "../components/booking/BookingFlightCard.jsx";
import SeatMap from "../components/booking/SeatMap.jsx";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";
import "../styles/Booking.css";
function Booking() {
  const {
    navigate,
    flight,
    loading,
    error,
    passenger,
    services,
    seats,
    selectedSeat,
    loadingSeats,
    creatingBooking,
    holdingSeat,
    chooseSeat,
    baggagePrice,
    mealPrice,
    insurancePrice,
    getSeatSurcharge,
    totalPrice,
    goPayment,
    firstSeats,
    businessSeats,
    economySeats
  } = useSeatBooking();
  if (!flight) {
    return <div className="booking-page">
        <Header />

        <main className="booking-main">
          <div className="booking-empty-card">
            <span className="empty-plane-icon">✈</span>

            <h2>{loading ? "Đang tải chuyến bay…" : error || "Không tìm thấy thông tin chuyến bay"}</h2>

            <p>
              Vui lòng quay lại danh sách hoặc trang chủ để chọn chuyến bay.
            </p>

            <button type="button" className="btn-back-home" onClick={() => navigate("/home")}>
              Về trang chủ
            </button>
          </div>
        </main>

        <Footer />
      </div>;
  }
  if (!passenger) {
    return <div className="booking-page">
        <Header />

        <main className="booking-main">
          <div className="booking-empty-card">
            <span className="empty-plane-icon">👤</span>

            <h2>Chưa có thông tin hành khách</h2>

            <p>Vui lòng điền thông tin hành khách trước khi chọn ghế.</p>

            <button type="button" className="btn-back-home" onClick={() => navigate(`/passenger-info?flightId=${flight.id}`, {
            state: {
              flight
            }
          })}>
              Nhập thông tin hành khách
            </button>
          </div>
        </main>

        <Footer />
      </div>;
  }
  return <div className="booking-page">
      <Header />

      <main className="booking-main">
        <div className="booking-inner">
          {/* =================================================
              STEP
           ================================================= */}

          <div className="booking-steps-bar">
            <div className="step-item completed">
              <span className="step-number">✓</span>

              <span className="step-label">1. Chọn chuyến bay</span>
            </div>

            <div className="step-line active" />

            <div className="step-item completed">
              <span className="step-number">✓</span>

              <span className="step-label">2. Thông tin hành khách</span>
            </div>

            <div className="step-line active" />

            <div className="step-item active">
              <span className="step-number">3</span>

              <span className="step-label">3. Chọn ghế ngồi</span>
            </div>

            <div className="step-line" />

            <div className="step-item">
              <span className="step-number">4</span>

              <span className="step-label">4. Thanh toán</span>
            </div>
          </div>

          {/* =================================================
              HEADER
           ================================================= */}

          <div className="booking-header">
            <div>
              <h1>Đặt chỗ chuyến bay & Chọn ghế</h1>

              <p>Chọn ghế mong muốn của bạn trên sơ đồ cabin bên dưới</p>
            </div>

            <button type="button" className="btn-back-step" onClick={() => navigate(`/passenger-info?flightId=${flight.id}`, {
            state: {
              flight, passenger, services
            }
          })}>
              ← Sửa thông tin hành khách
            </button>
          </div>

          {/* =================================================
              GRID
           ================================================= */}

          <div className="booking-grid">
            {/* =================================================
                LEFT - CABIN
             ================================================= */}

            <SeatMap loadingSeats={loadingSeats} seats={seats} firstSeats={firstSeats} selectedSeat={selectedSeat} holdingSeat={holdingSeat} creatingBooking={creatingBooking} chooseSeat={chooseSeat} businessSeats={businessSeats} economySeats={economySeats} />

            {/* =================================================
                RIGHT
             ================================================= */}

            <div className="booking-summary-sidebar">
              {/* FLIGHT */}

              <BookingFlightCard flight={flight} />

              {/* =================================================
                  PASSENGER
               ================================================= */}

              <BookingPassengerCard passenger={passenger} />

              {/* =================================================
                  SEAT + PRICE
               ================================================= */}

              <BookingPriceSummary selectedSeat={selectedSeat} flight={flight} getSeatSurcharge={getSeatSurcharge} baggagePrice={baggagePrice} services={services} mealPrice={mealPrice} insurancePrice={insurancePrice} totalPrice={totalPrice} creatingBooking={creatingBooking} goPayment={goPayment} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>;
}
export default Booking;
