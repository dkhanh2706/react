import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

import "../styles/Booking.css";

// =====================================================
// FORMAT DATE
// =====================================================

const formatDate = (value) => {
  if (!value) return "Chưa cập nhật";

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
// FORMAT MONEY
// =====================================================

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
};

// =====================================================
// NORMALIZE SEAT CLASS
// =====================================================

const normalizeSeatClass = (value) => {
  return String(value || "")
    .trim()
    .toUpperCase();
};

// =====================================================
// NORMALIZE SEAT STATUS
// =====================================================

const normalizeSeatStatus = (value) => {
  return String(value || "AVAILABLE")
    .trim()
    .toUpperCase();
};

// =====================================================
// NORMALIZE SEAT ARRAY
// Đưa ra ngoài component -> không cần useCallback
// =====================================================

const normalizeSeats = (seatData) => {
  if (!Array.isArray(seatData)) {
    return [];
  }

  return seatData.map((seat) => ({
    ...seat,

    class: normalizeSeatClass(seat.class),

    status: normalizeSeatStatus(seat.status),
  }));
};

// =====================================================
// COMPONENT
// =====================================================

function Booking() {
  const location = useLocation();

  const navigate = useNavigate();

  // ===================================================
  // STATE DATA TỪ PASSENGER INFO
  // ===================================================

  const flight = location.state?.flight;

  const passenger = location.state?.passenger;

  const services = location.state?.services || {
    baggage_weight: 0,

    baggage_price: 0,

    meal_type: "NONE",

    meal_name: "Không chọn suất ăn",

    meal_price: 0,

    insurance: false,

    insurance_price: 0,

    service_price: 0,
  };

  // ===================================================
  // COMPONENT STATE
  // ===================================================

  const [seats, setSeats] = useState([]);

  const [selectedSeat, setSelectedSeat] = useState(null);

  const [loadingSeats, setLoadingSeats] = useState(false);

  const [creatingBooking, setCreatingBooking] = useState(false);
  const [holdingSeat, setHoldingSeat] = useState(false);

  // ===================================================
  // LOGIN
  // ===================================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Vui lòng đăng nhập để đặt vé");

      navigate("/login", {
        replace: true,
      });
    }
  }, [navigate]);

  // ===================================================
  // LOAD SEAT
  // Không dùng useCallback
  // ===================================================

  useEffect(() => {
    const fetchSeats = async () => {
      if (!flight?.id) {
        return;
      }

      try {
        setLoadingSeats(true);

        const response = await api.get(`/seats/flight/${flight.id}`);

        const rawSeats = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        setSeats(normalizeSeats(rawSeats));
      } catch (error) {
        console.error("Lỗi tải ghế:", error.response?.data || error);

        toast.error("Không thể tải danh sách ghế");
      } finally {
        setLoadingSeats(false);
      }
    };

    fetchSeats();
  }, [flight?.id]);

  // ===================================================
  // RELOAD SEATS
  // Function bình thường
  // ===================================================

  const reloadSeats = async () => {
    if (!flight?.id) {
      return;
    }

    try {
      const response = await api.get(`/seats/flight/${flight.id}`);

      const rawSeats = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setSeats(normalizeSeats(rawSeats));
    } catch (error) {
      console.error("Lỗi reload ghế:", error.response?.data || error);
    }
  };

  // ===================================================
  // CHỌN GHẾ
  // ===================================================

  const chooseSeat = async (seat) => {
    if (holdingSeat || creatingBooking) return;
    const seatStatus = normalizeSeatStatus(seat.status);

    // BOOKED
    if (seatStatus === "BOOKED") {
      toast.error("Ghế này đã có người đặt");

      return;
    }

    // HOLD
    if (seatStatus === "HOLD" && !seat.held_by_me) {
      toast.error("Ghế này đang được người khác giữ");

      return;
    }

    try {
      setHoldingSeat(true);
      const holdData = {
        flight_id: flight.id,

        seat_id: seat.id,

        seat_class: normalizeSeatClass(seat.class),
      };

      const response = await api.post("/bookings/hold-seat", holdData);

      setSelectedSeat({
        ...seat,

        class: normalizeSeatClass(seat.class),

        status: "HOLD",

        hold_expires_at: response.data?.hold_expires_at,
      });

      toast.success(`Đã chọn ghế ${seat.seat_number}`);

      await reloadSeats();
    } catch (error) {
      console.error("Lỗi giữ ghế:", error.response?.data || error);

      toast.error(error.response?.data?.message || "Không thể giữ ghế");

      await reloadSeats();
    } finally { setHoldingSeat(false); }
  };

  // ===================================================
  // SERVICE PRICE
  // ===================================================

  const baggagePrice = Number(services?.baggage_price || 0);

  const mealPrice = Number(services?.meal_price || 0);

  const insurancePrice = Number(services?.insurance_price || 0);

  const servicePrice = baggagePrice + mealPrice + insurancePrice;

  // ===================================================
  // SEAT FARE
  // ===================================================

  const getSeatFare = () => {
    const basePrice = Number(flight?.price || 0);

    const seatClass = normalizeSeatClass(selectedSeat?.class);

    // Giữ logic cũ của project:
    // BUSINESS = giá gốc * 1.5
    if (seatClass === "BUSINESS") {
      return basePrice * 1.5;
    }

    return seatClass === "FIRST" ? basePrice * 2 : basePrice;
  };

  // ===================================================
  // SEAT SURCHARGE
  // ===================================================

  const getSeatSurcharge = () => {
    const basePrice = Number(flight?.price || 0);

    return Math.max(0, getSeatFare() - basePrice);
  };

  // ===================================================
  // TOTAL
  // ===================================================

  const totalPrice = () => {
    return getSeatFare() + servicePrice;
  };

  // ===================================================
  // GO PAYMENT
  // ===================================================

  const goPayment = async () => {
    if (!selectedSeat) {
      toast.error("Vui lòng chọn ghế trước khi tiếp tục");

      return;
    }

    if (!passenger) {
      toast.error("Không tìm thấy thông tin hành khách");

      navigate("/passenger-info", {
        state: {
          flight,
        },
      });

      return;
    }

    if (creatingBooking) {
      return;
    }

    try {
      setCreatingBooking(true);

      // =================================================
      // DATA GỬI BACKEND
      // =================================================

      const bookingData = {
        // FLIGHT
        flight_id: flight.id,

        // SEAT
        seat_id: selectedSeat.id,

        // PASSENGER
        passenger: {
          full_name: passenger.full_name,

          gender: passenger.gender,

          date_of_birth: passenger.date_of_birth,

          document_type: passenger.document_type,

          document_number: passenger.document_number,

          phone: passenger.phone,

          email: passenger.email,
        },

        // SERVICES
        services: {
          baggage_weight: Number(services?.baggage_weight || 0),

          meal_type: services?.meal_type || "NONE",

          insurance: Boolean(services?.insurance),
        },
      };

      // =================================================
      // CREATE BOOKING
      // =================================================

      const response = await api.post("/bookings", bookingData);

      // =================================================
      // SERVER RESPONSE
      // =================================================

      const serverBooking = response.data?.booking;

      const serverServices = response.data?.services || services;

      const serverPricing = response.data?.pricing || {
        base_price: Number(flight.price || 0),

        seat_surcharge: getSeatSurcharge(),

        baggage_price: baggagePrice,

        meal_price: mealPrice,

        insurance_price: insurancePrice,

        total_price: totalPrice(),
      };

      // =================================================
      // PAYMENT PAGE
      // =================================================

      navigate("/payment", {
        state: {
          flight,

          seat: selectedSeat,

          passenger,

          services: serverServices,

          pricing: serverPricing,

          booking: serverBooking,

          price: Number(
            serverBooking?.total_price ||
              serverPricing?.total_price ||
              totalPrice(),
          ),

          hold_expires_at:
            response.data?.hold_expires_at || selectedSeat?.hold_expires_at,
        },
      });
    } catch (error) {
      console.error("Lỗi tạo booking:", error.response?.data || error);

      toast.error(error.response?.data?.message || "Không thể tạo booking");

      await reloadSeats();
    } finally {
      setCreatingBooking(false);
    }
  };

  // ===================================================
  // NO FLIGHT
  // ===================================================

  if (!flight) {
    return (
      <div className="booking-page">
        <Header />

        <main className="booking-main">
          <div className="booking-empty-card">
            <span className="empty-plane-icon">✈</span>

            <h2>Không tìm thấy thông tin chuyến bay</h2>

            <p>
              Vui lòng quay lại danh sách hoặc trang chủ để chọn chuyến bay.
            </p>

            <button
              type="button"
              className="btn-back-home"
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
  // NO PASSENGER
  // ===================================================

  if (!passenger) {
    return (
      <div className="booking-page">
        <Header />

        <main className="booking-main">
          <div className="booking-empty-card">
            <span className="empty-plane-icon">👤</span>

            <h2>Chưa có thông tin hành khách</h2>

            <p>Vui lòng điền thông tin hành khách trước khi chọn ghế.</p>

            <button
              type="button"
              className="btn-back-home"
              onClick={() =>
                navigate("/passenger-info", {
                  state: {
                    flight,
                  },
                })
              }
            >
              Nhập thông tin hành khách
            </button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // ===================================================
  // SEAT GROUPS
  // ===================================================

  const firstSeats = seats.filter(
    (seat) => normalizeSeatClass(seat.class) === "FIRST",
  );

  const businessSeats = seats.filter(
    (seat) => normalizeSeatClass(seat.class) === "BUSINESS",
  );

  const economySeats = seats.filter(
    (seat) => normalizeSeatClass(seat.class) === "ECONOMY",
  );

  // ===================================================
  // RENDER SEAT
  // ===================================================

  const renderSeat = (seat) => {
    const seatStatus = normalizeSeatStatus(seat.status);

    const seatClassValue = normalizeSeatClass(seat.class);

    const isBooked = seatStatus === "BOOKED";

    const isHold = seatStatus === "HOLD";

    const isSelected = selectedSeat?.id === seat.id;

    let seatClass = "seat economy";

    if (isSelected) {
      seatClass = "seat selected";
    } else if (isBooked) {
      seatClass = "seat booked";
    } else if (isHold) {
      seatClass = "seat held";
    } else if (seatClassValue === "BUSINESS" || seatClassValue === "FIRST") {
      seatClass = "seat business";
    }

    return (
      <button
        key={seat.id}
        type="button"
        disabled={holdingSeat || creatingBooking || ((isBooked || (isHold && !seat.held_by_me)) && !isSelected)}
        className={seatClass}
        onClick={() => {
          if (!isSelected && !isBooked && (!isHold || seat.held_by_me)) {
            chooseSeat(seat);
          }
        }}
        title={`Ghế ${seat.seat_number} - ${seatClassValue}`}
      >
        <span className="seat-num">{seat.seat_number}</span>

        <span className="seat-status-label">
          {isSelected
            ? "Đang chọn"
            : isBooked
              ? "Đã đặt"
              : isHold
                ? "Giữ"
                : seatClassValue === "BUSINESS"
                  ? "VIP"
                  : seatClassValue === "FIRST"
                    ? "First"
                    : "Eco"}
        </span>
      </button>
    );
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="booking-page">
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

            <button
              type="button"
              className="btn-back-step"
              onClick={() =>
                navigate("/passenger-info", {
                  state: {
                    flight,
                  },
                })
              }
            >
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

            <div className="cabin-map-section">
              <div className="cabin-map-card">
                {/* HEADER */}

                <div className="cabin-header">
                  <h2>Sơ đồ khoang hành khách</h2>

                  <div className="seat-legend">
                    <span className="legend-item">
                      <span className="legend-dot available-eco" />
                      Phổ thông
                    </span>

                    <span className="legend-item">
                      <span className="legend-dot available-biz" />
                      Thương gia
                    </span>

                    <span className="legend-item">
                      <span className="legend-dot selected-dot" />
                      Đang chọn
                    </span>

                    <span className="legend-item">
                      <span className="legend-dot booked-dot" />
                      Đã đặt/Giữ
                    </span>
                  </div>
                </div>

                {/* NOSE */}

                <div className="airplane-nose">
                  <div className="cockpit-icon">👨‍✈️ Buồng lái / Khoang mũi</div>
                </div>

                {/* SEATS */}

                {loadingSeats ? (
                  <div className="cabin-loading">
                    <div className="spinner-plane">✈</div>

                    <p>Đang tải sơ đồ ghế ngồi trên chuyến bay...</p>
                  </div>
                ) : seats.length === 0 ? (
                  <div className="cabin-empty">
                    <p>Chuyến bay này hiện chưa có dữ liệu sơ đồ ghế.</p>
                  </div>
                ) : (
                  <div className="cabin-seats-wrapper">
                    {/* FIRST */}

                    {firstSeats.length > 0 && (
                      <div className="cabin-zone">
                        <div className="zone-tag first-tag">
                          <span>FIRST CLASS</span>
                        </div>

                        <div className="seats-grid first-grid">
                          {firstSeats.map(renderSeat)}
                        </div>
                      </div>
                    )}

                    {/* BUSINESS */}

                    {businessSeats.length > 0 && (
                      <div className="cabin-zone">
                        <div className="zone-tag biz-tag">
                          <span>BUSINESS CLASS (HẠNG THƯƠNG GIA)</span>
                        </div>

                        <div className="seats-grid biz-grid">
                          {businessSeats.map(renderSeat)}
                        </div>
                      </div>
                    )}

                    {/* DIVIDER */}

                    {(firstSeats.length > 0 || businessSeats.length > 0) &&
                      economySeats.length > 0 && (
                        <div className="cabin-divider">
                          <span>✦ LỐI ĐI VÀ CỬA THOÁT HIỂM ✦</span>
                        </div>
                      )}

                    {/* ECONOMY */}

                    {economySeats.length > 0 && (
                      <div className="cabin-zone">
                        <div className="zone-tag eco-tag">
                          <span>ECONOMY CLASS (HẠNG PHỔ THÔNG)</span>
                        </div>

                        <div className="seats-grid eco-grid">
                          {economySeats.map(renderSeat)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAIL */}

                <div className="airplane-tail">
                  <span>Khoang sau / Đuôi máy bay</span>
                </div>
              </div>
            </div>

            {/* =================================================
                RIGHT
            ================================================= */}

            <div className="booking-summary-sidebar">
              {/* FLIGHT */}

              <div className="summary-card flight-card-ticket">
                <div className="ticket-header">
                  <div className="ticket-airline">
                    <span className="plane-mini-badge">✈</span>

                    <div>
                      <h3>{flight.airline || "Hãng hàng không"}</h3>

                      <span className="pnr-badge">
                        Mã chuyến: {flight.flight_number || "---"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ticket-body">
                  <div className="ticket-route-row">
                    {/* FROM */}

                    <div className="route-col">
                      <span className="route-city-code">
                        {flight.departure_code || flight.from || "HAN"}
                      </span>

                      <strong className="route-time">
                        {formatTime(flight.departure_time)}
                      </strong>
                    </div>

                    {/* ROUTE */}

                    <div className="route-arrow-center">
                      <span className="arrow-text">Bay thẳng</span>

                      <div className="arrow-line">──────✈──────</div>
                    </div>

                    {/* TO */}

                    <div className="route-col text-right">
                      <span className="route-city-code">
                        {flight.arrival_code || flight.to || "SGN"}
                      </span>

                      <strong className="route-time">
                        {formatTime(flight.arrival_time)}
                      </strong>
                    </div>
                  </div>

                  {/* META */}

                  <div className="ticket-meta-grid">
                    <div className="meta-box">
                      <small>Ngày khởi hành</small>

                      <strong>{formatDate(flight.date)}</strong>
                    </div>

                    <div className="meta-box">
                      <small>Giá vé gốc</small>

                      <strong>{formatMoney(flight.price)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================================
                  PASSENGER
              ================================================= */}

              <div className="summary-card">
                <h3>Thông tin hành khách</h3>

                <div
                  style={{
                    display: "grid",
                    gap: "8px",
                    fontSize: "13px",
                  }}
                >
                  <div>
                    <strong>{passenger.full_name}</strong>
                  </div>

                  <div>
                    {passenger.gender === "MALE"
                      ? "Nam"
                      : passenger.gender === "FEMALE"
                        ? "Nữ"
                        : "Khác"}

                    {" • "}

                    {formatDate(passenger.date_of_birth)}
                  </div>

                  <div>
                    {passenger.document_type}: {passenger.document_number}
                  </div>

                  <div>📞 {passenger.phone}</div>

                  <div>✉ {passenger.email}</div>
                </div>
              </div>

              {/* =================================================
                  SEAT + PRICE
              ================================================= */}

              <div className="summary-card seat-selection-summary">
                <h3>Chi tiết đặt chỗ</h3>

                {selectedSeat ? (
                  <div className="selected-seat-details">
                    {/* SELECTED SEAT */}

                    <div className="seat-chosen-banner">
                      <div className="seat-big-badge">
                        {selectedSeat.seat_number}
                      </div>

                      <div>
                        <strong>Ghế số {selectedSeat.seat_number}</strong>

                        <p>Hạng: {normalizeSeatClass(selectedSeat.class)}</p>
                      </div>
                    </div>

                    {/* PRICE */}

                    <div className="price-breakdown">
                      {/* BASE */}

                      <div className="breakdown-row">
                        <span>Giá vé cơ bản</span>

                        <span>{formatMoney(flight.price)}</span>
                      </div>

                      {/* BUSINESS */}

                      {getSeatSurcharge() > 0 && (
                        <div className="breakdown-row highlight">
                          <span>Phụ thu hạng Thương gia</span>

                          <span>{formatMoney(getSeatSurcharge())}</span>
                        </div>
                      )}

                      {/* BAGGAGE */}

                      {baggagePrice > 0 && (
                        <div className="breakdown-row">
                          <span>Hành lý {services.baggage_weight || 0}kg</span>

                          <span>{formatMoney(baggagePrice)}</span>
                        </div>
                      )}

                      {/* MEAL */}

                      {mealPrice > 0 && (
                        <div className="breakdown-row">
                          <span>Suất ăn</span>

                          <span>{formatMoney(mealPrice)}</span>
                        </div>
                      )}

                      {/* INSURANCE */}

                      {insurancePrice > 0 && (
                        <div className="breakdown-row">
                          <span>Bảo hiểm</span>

                          <span>{formatMoney(insurancePrice)}</span>
                        </div>
                      )}

                      {/* TOTAL */}

                      <div className="breakdown-row total-row">
                        <span>Tổng tạm tính</span>

                        <strong className="final-price">
                          {formatMoney(totalPrice())}
                        </strong>
                      </div>
                    </div>

                    {/* HOLD NOTICE */}

                    <div className="hold-time-notice">
                      <span>⏳</span>
                      Ghế sẽ được giữ tạm thời trong 15 phút.
                    </div>
                  </div>
                ) : (
                  <div className="no-seat-selected">
                    <span className="seat-prompt-icon">💺</span>

                    <p>
                      Vui lòng nhấp chọn 1 ghế trên sơ đồ cabin để tiếp tục.
                    </p>
                  </div>
                )}

                {/* =================================================
                    PAYMENT BUTTON
                ================================================= */}

                <button
                  type="button"
                  className="btn-proceed-pay"
                  disabled={creatingBooking || !selectedSeat}
                  onClick={goPayment}
                >
                  {creatingBooking
                    ? "Đang xử lý đặt chỗ..."
                    : selectedSeat
                      ? `Tiếp tục thanh toán (${formatMoney(totalPrice())}) →`
                      : "Vui lòng chọn ghế"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Booking;
