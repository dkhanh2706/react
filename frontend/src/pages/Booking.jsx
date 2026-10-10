import { useEffect, useState, useCallback } from "react";
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
  if (Number.isNaN(date.getTime())) return stringValue;
  return date.toLocaleDateString("vi-VN");
};

// =====================================================
// FORMAT TIME
// =====================================================

const formatTime = (value) => {
  if (!value) return "--:--";
  const stringValue = String(value);
  if (/^\d{2}:\d{2}$/.test(stringValue)) return stringValue;
  if (/^\d{2}:\d{2}:\d{2}/.test(stringValue)) return stringValue.slice(0, 5);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return stringValue;
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// =====================================================
// NORMALIZE HELPERS
// =====================================================

const normalizeSeatClass = (value) => {
  return String(value || "").trim().toUpperCase();
};

const normalizeSeatStatus = (value) => {
  return String(value || "AVAILABLE").trim().toUpperCase();
};

function Booking() {
  const location = useLocation();
  const navigate = useNavigate();

  const flight = location.state?.flight;

  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);

  // CHECK LOGIN
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để đặt vé");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const normalizeSeats = useCallback((seatData) => {
    if (!Array.isArray(seatData)) return [];
    return seatData.map((seat) => ({
      ...seat,
      class: normalizeSeatClass(seat.class),
      status: normalizeSeatStatus(seat.status),
    }));
  }, []);

  // LOAD SEATS
  const reloadSeats = useCallback(async () => {
    if (!flight?.id) return;
    try {
      const response = await api.get(`/seats/flight/${flight.id}`);
      const rawSeats = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setSeats(normalizeSeats(rawSeats));
    } catch (error) {
      console.error("Lỗi reload ghế:", error.response?.data || error);
    }
  }, [flight?.id, normalizeSeats]);

  useEffect(() => {
    const fetchSeats = async () => {
      if (!flight?.id) return;
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
  }, [flight?.id, normalizeSeats]);

  // CHỌN GHẾ
  const chooseSeat = async (seat) => {
    const seatStatus = normalizeSeatStatus(seat.status);

    if (seatStatus === "BOOKED") {
      toast.error("Ghế này đã có người đặt");
      return;
    }

    if (seatStatus === "HOLD") {
      toast.error("Ghế này đang được người khác giữ");
      return;
    }

    try {
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
    }
  };

  // GIÁ TIỀN
  const totalPrice = () => {
    let price = Number(flight?.price || 0);
    if (normalizeSeatClass(selectedSeat?.class) === "BUSINESS") {
      price *= 1.5;
    }
    return price;
  };

  // TẠO BOOKING
  const goPayment = async () => {
    if (!selectedSeat) {
      toast.error("Vui lòng chọn ghế trước khi tiếp tục");
      return;
    }

    if (creatingBooking) return;

    try {
      setCreatingBooking(true);

      const bookingData = {
        flight_id: flight.id,
        seat_id: selectedSeat.id,
        seat_class: normalizeSeatClass(selectedSeat.class),
        price: totalPrice(),
        flight_date: flight.date || null,
        departure_place: flight.departure_code || flight.from || null,
        arrival_place: flight.arrival_code || flight.to || null,
        departure_time: formatTime(flight.departure_time),
        arrival_time: formatTime(flight.arrival_time),
        airline: flight.airline || null,
        flight_number: flight.flight_number || null,
        seat_number: selectedSeat.seat_number || null,
      };

      const response = await api.post("/bookings", bookingData);

      navigate("/payment", {
        state: {
          flight,
          seat: selectedSeat,
          booking: response.data.booking,
          price: totalPrice(),
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

  // KHÔNG CÓ DỮ LIỆU
  if (!flight) {
    return (
      <div className="booking-page">
        <Header />
        <main className="booking-main">
          <div className="booking-empty-card">
            <span className="empty-plane-icon">✈</span>
            <h2>Không tìm thấy thông tin chuyến bay</h2>
            <p>Vui lòng quay lại danh sách hoặc trang chủ để chọn chuyến bay.</p>
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

  // PHÂN LOẠI GHẾ
  const businessSeats = seats.filter(
    (seat) => normalizeSeatClass(seat.class) === "BUSINESS"
  );
  const economySeats = seats.filter(
    (seat) => normalizeSeatClass(seat.class) === "ECONOMY"
  );
  const firstSeats = seats.filter(
    (seat) => normalizeSeatClass(seat.class) === "FIRST"
  );

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
        disabled={(isBooked || isHold) && !isSelected}
        className={seatClass}
        onClick={() => {
          if (!isSelected && !isBooked && !isHold) {
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
            : "Eco"}
        </span>
      </button>
    );
  };

  return (
    <div className="booking-page">
      <Header />

      <main className="booking-main">
        <div className="booking-inner">
          {/* STEP PROGRESS */}
          <div className="booking-steps-bar">
            <div className="step-item completed">
              <span className="step-number">✓</span>
              <span className="step-label">1. Chọn chuyến bay</span>
            </div>
            <div className="step-line active" />
            <div className="step-item active">
              <span className="step-number">2</span>
              <span className="step-label">2. Chọn ghế ngồi</span>
            </div>
            <div className="step-line" />
            <div className="step-item">
              <span className="step-number">3</span>
              <span className="step-label">3. Thanh toán</span>
            </div>
          </div>

          <div className="booking-header">
            <div>
              <h1>Đặt chỗ chuyến bay & Chọn ghế</h1>
              <p>Chọn ghế mong muốn của bạn trên sơ đồ cabin bên dưới</p>
            </div>
            <button
              type="button"
              className="btn-back-step"
              onClick={() => navigate(-1)}
            >
              ← Đổi chuyến bay
            </button>
          </div>

          <div className="booking-grid">
            {/* CỘT TRÁI: SƠ ĐỒ CHỌN GHẾ */}
            <div className="cabin-map-section">
              <div className="cabin-map-card">
                <div className="cabin-header">
                  <h2>Sơ đồ khoang hành khách</h2>
                  <div className="seat-legend">
                    <span className="legend-item">
                      <span className="legend-dot available-eco" /> Phổ thông
                    </span>
                    <span className="legend-item">
                      <span className="legend-dot available-biz" /> Thương gia
                    </span>
                    <span className="legend-item">
                      <span className="legend-dot selected-dot" /> Đang chọn
                    </span>
                    <span className="legend-item">
                      <span className="legend-dot booked-dot" /> Đã đặt/Giữ
                    </span>
                  </div>
                </div>

                {/* AIRPLANE NOSE GRAPHIC */}
                <div className="airplane-nose">
                  <div className="cockpit-icon">👨‍✈️ Buồng lái / Khoang mũi</div>
                </div>

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
                    {/* FIRST CLASS */}
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

                    {/* BUSINESS CLASS */}
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

                    {/* AISLE DIVIDER */}
                    {(firstSeats.length > 0 || businessSeats.length > 0) &&
                      economySeats.length > 0 && (
                        <div className="cabin-divider">
                          <span>✦ LỐI ĐI VÀ CỬA THOÁT HIỂM ✦</span>
                        </div>
                      )}

                    {/* ECONOMY CLASS */}
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

                <div className="airplane-tail">
                  <span>Khoang sau / Đuôi máy bay</span>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: THÔNG TIN VÉ & TỔNG TIỀN */}
            <div className="booking-summary-sidebar">
              {/* THÔNG TIN CHUYẾN BAY */}
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
                    <div className="route-col">
                      <span className="route-city-code">
                        {flight.departure_code || flight.from || "HAN"}
                      </span>
                      <strong className="route-time">
                        {formatTime(flight.departure_time)}
                      </strong>
                    </div>

                    <div className="route-arrow-center">
                      <span className="arrow-text">Bay thẳng</span>
                      <div className="arrow-line">──────✈──────</div>
                    </div>

                    <div className="route-col text-right">
                      <span className="route-city-code">
                        {flight.arrival_code || flight.to || "SGN"}
                      </span>
                      <strong className="route-time">
                        {formatTime(flight.arrival_time)}
                      </strong>
                    </div>
                  </div>

                  <div className="ticket-meta-grid">
                    <div className="meta-box">
                      <small>Ngày khởi hành</small>
                      <strong>{formatDate(flight.date)}</strong>
                    </div>
                    <div className="meta-box">
                      <small>Giá vé gốc</small>
                      <strong>
                        {Number(flight.price || 0).toLocaleString("vi-VN")}đ
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* GHẾ ĐÃ CHỌN */}
              <div className="summary-card seat-selection-summary">
                <h3>Chi tiết đặt chỗ</h3>

                {selectedSeat ? (
                  <div className="selected-seat-details">
                    <div className="seat-chosen-banner">
                      <div className="seat-big-badge">
                        {selectedSeat.seat_number}
                      </div>
                      <div>
                        <strong>Ghế số {selectedSeat.seat_number}</strong>
                        <p>Hạng: {normalizeSeatClass(selectedSeat.class)}</p>
                      </div>
                    </div>

                    <div className="price-breakdown">
                      <div className="breakdown-row">
                        <span>Giá vé cơ bản</span>
                        <span>
                          {Number(flight.price || 0).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      {normalizeSeatClass(selectedSeat.class) === "BUSINESS" && (
                        <div className="breakdown-row highlight">
                          <span>Phụ thu Hạng Thương gia</span>
                          <span>
                            {(Number(flight.price || 0) * 0.5).toLocaleString(
                              "vi-VN"
                            )}
                            đ
                          </span>
                        </div>
                      )}
                      <div className="breakdown-row total-row">
                        <span>Tổng tạm tính</span>
                        <strong className="final-price">
                          {totalPrice().toLocaleString("vi-VN")}đ
                        </strong>
                      </div>
                    </div>

                    <div className="hold-time-notice">
                      <span>⏳</span> Ghế sẽ được giữ tạm thời trong 15 phút sau khi đặt.
                    </div>
                  </div>
                ) : (
                  <div className="no-seat-selected">
                    <span className="seat-prompt-icon">💺</span>
                    <p>Vui lòng nhấp chọn 1 ghế trên sơ đồ cabin để tiếp tục.</p>
                  </div>
                )}

                <button
                  type="button"
                  className="btn-proceed-pay"
                  disabled={creatingBooking || !selectedSeat}
                  onClick={goPayment}
                >
                  {creatingBooking
                    ? "Đang xử lý đặt chỗ..."
                    : selectedSeat
                    ? `Tiếp tục thanh toán (${totalPrice().toLocaleString("vi-VN")}đ) →`
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
