import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import api from "../api/axios";

import "../styles/Booking.css";

// =====================================================
// FORMAT DATE
// =====================================================

const formatDate = (value) => {
  if (!value) {
    return "Chưa cập nhật";
  }

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
  if (!value) {
    return "--:--";
  }

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
// NORMALIZE CLASS
// =====================================================

const normalizeSeatClass = (value) => {
  return String(value || "")
    .trim()
    .toUpperCase();
};

// =====================================================
// NORMALIZE STATUS
// =====================================================

const normalizeSeatStatus = (value) => {
  return String(value || "AVAILABLE")
    .trim()
    .toUpperCase();
};

// =====================================================
// BOOKING
// =====================================================

function Booking() {
  const location = useLocation();
  const navigate = useNavigate();

  // =====================================================
  // CHUYẾN BAY ĐƯỢC CHỌN
  // =====================================================

  const flight = location.state?.flight;

  // =====================================================
  // STATE
  // =====================================================

  const [seats, setSeats] = useState([]);

  const [selectedSeat, setSelectedSeat] = useState(null);

  const [loadingSeats, setLoadingSeats] = useState(false);

  const [creatingBooking, setCreatingBooking] = useState(false);

  // =====================================================
  // LOGIN
  // =====================================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Vui lòng đăng nhập để đặt vé");

      navigate("/login", {
        replace: true,
      });
    }
  }, [navigate]);

  // =====================================================
  // NORMALIZE DANH SÁCH GHẾ
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
  // LOAD GHẾ
  // =====================================================

  useEffect(() => {
    if (!flight?.id) {
      return;
    }

    const fetchSeats = async () => {
      try {
        setLoadingSeats(true);

        console.log("Đang tải ghế flight:", flight.id);

        const response = await api.get(`/seats/flight/${flight.id}`);

        console.log("API seats response:", response.data);

        const rawSeats = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        const normalized = normalizeSeats(rawSeats);

        console.log("Danh sách ghế sau normalize:", normalized);

        setSeats(normalized);
      } catch (error) {
        console.error("Lỗi tải danh sách ghế:", error.response?.data || error);

        setSeats([]);

        toast.error(
          error.response?.data?.message || "Không thể tải danh sách ghế",
        );
      } finally {
        setLoadingSeats(false);
      }
    };

    fetchSeats();
  }, [flight?.id]);

  // =====================================================
  // RELOAD GHẾ
  // =====================================================

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

  // =====================================================
  // CHỌN GHẾ
  // =====================================================

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

      console.log("HOLD PAYLOAD:", holdData);

      const response = await api.post("/bookings/hold-seat", holdData);

      console.log("HOLD SUCCESS:", response.data);

      setSelectedSeat({
        ...seat,

        class: normalizeSeatClass(seat.class),

        status: "HOLD",

        hold_expires_at: response.data?.hold_expires_at,
      });

      toast.success(`Đã giữ ghế ${seat.seat_number} trong 15 phút`);

      await reloadSeats();
    } catch (error) {
      console.error("Lỗi giữ ghế:", error.response?.data || error);

      toast.error(error.response?.data?.message || "Không thể giữ ghế");

      await reloadSeats();
    }
  };

  // =====================================================
  // GIÁ
  // =====================================================

  const totalPrice = () => {
    let price = Number(flight?.price || 0);

    if (normalizeSeatClass(selectedSeat?.class) === "BUSINESS") {
      price *= 1.5;
    }

    return price;
  };

  // =====================================================
  // TẠO BOOKING
  // =====================================================

  const goPayment = async () => {
    if (!selectedSeat) {
      toast.error("Vui lòng chọn ghế");

      return;
    }

    if (creatingBooking) {
      return;
    }

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

      console.log("BOOKING PAYLOAD:", bookingData);

      const response = await api.post("/bookings", bookingData);

      console.log("BOOKING SUCCESS:", response.data);

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

  // =====================================================
  // KHÔNG CÓ FLIGHT
  // =====================================================

  if (!flight) {
    return (
      <div className="booking-container">
        <div className="booking-wrapper">
          <h2>Không có dữ liệu chuyến bay</h2>

          <button type="button" onClick={() => navigate("/home")}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // PHÂN LOẠI
  // =====================================================

  const businessSeats = seats.filter(
    (seat) => normalizeSeatClass(seat.class) === "BUSINESS",
  );

  const economySeats = seats.filter(
    (seat) => normalizeSeatClass(seat.class) === "ECONOMY",
  );

  const firstSeats = seats.filter(
    (seat) => normalizeSeatClass(seat.class) === "FIRST",
  );

  // =====================================================
  // RENDER SEAT
  // =====================================================

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
    } else if (seatClassValue === "BUSINESS") {
      seatClass = "seat business";
    } else if (seatClassValue === "FIRST") {
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
      >
        <b>{seat.seat_number}</b>

        <small>
          {isSelected
            ? "Đã chọn"
            : isBooked
              ? "Đã đặt"
              : isHold
                ? "Đang giữ"
                : seatClassValue}
        </small>
      </button>
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="booking-container">
      <div className="booking-wrapper">
        <h1>✈ Đặt chỗ chuyến bay</h1>

        {/* ===============================================
            FLIGHT INFO
        =============================================== */}

        <div className="flight-info">
          <h2>{flight.airline || "Airline"}</h2>

          <p>
            <strong>{flight.departure_code || flight.from || "---"}</strong>

            {" → "}

            <strong>{flight.arrival_code || flight.to || "---"}</strong>
          </p>

          <p>
            Mã chuyến: <strong>{flight.flight_number || "---"}</strong>
          </p>

          <p>
            Ngày bay: <strong>{formatDate(flight.date)}</strong>
          </p>

          <p>
            Giờ bay: <strong>{formatTime(flight.departure_time)}</strong>
            {" → "}
            <strong>{formatTime(flight.arrival_time)}</strong>
          </p>

          <h3>{Number(flight.price || 0).toLocaleString("vi-VN")}đ</h3>
        </div>

        {/* ===============================================
            CHỌN GHẾ
        =============================================== */}

        <div className="seat-section">
          <div className="seat-section-title">
            <div>
              <h2>Chọn ghế</h2>

              {!loadingSeats && seats.length > 0 && (
                <p>Có {seats.length} ghế trên chuyến bay này</p>
              )}
            </div>
          </div>

          {loadingSeats ? (
            <div className="seat-loading">Đang tải danh sách ghế...</div>
          ) : seats.length === 0 ? (
            <div className="seat-empty">
              <h3>Không tìm thấy ghế</h3>

              <p>Máy bay của chuyến này hiện chưa có dữ liệu ghế.</p>
            </div>
          ) : (
            <>
              {/* =========================================
                  FIRST
              ========================================= */}

              {firstSeats.length > 0 && (
                <div className="seat-class-group">
                  <h3>FIRST CLASS</h3>

                  <div className="seat-container">
                    {firstSeats.map(renderSeat)}
                  </div>
                </div>
              )}

              {/* =========================================
                  BUSINESS
              ========================================= */}

              {businessSeats.length > 0 && (
                <div className="seat-class-group">
                  <h3>BUSINESS</h3>

                  <div className="seat-container">
                    {businessSeats.map(renderSeat)}
                  </div>
                </div>
              )}

              {/* =========================================
                  ECONOMY
              ========================================= */}

              {economySeats.length > 0 && (
                <div className="seat-class-group">
                  <h3>ECONOMY</h3>

                  <div className="seat-container">
                    {economySeats.map(renderSeat)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ===============================================
            GHẾ ĐÃ CHỌN
        =============================================== */}

        {selectedSeat && (
          <div className="seat-info">
            <h3>Ghế {selectedSeat.seat_number}</h3>

            <p>Hạng: {normalizeSeatClass(selectedSeat.class)}</p>

            <p>Giá: {totalPrice().toLocaleString("vi-VN")}đ</p>

            <p>⏳ Ghế được giữ trong 15 phút</p>
          </div>
        )}

        {/* ===============================================
            ACTION
        =============================================== */}

        <div className="booking-actions">
          <button
            type="button"
            className="back-button"
            disabled={creatingBooking}
            onClick={() => navigate(-1)}
          >
            ← Quay lại
          </button>

          <button
            type="button"
            className="payment-button"
            disabled={creatingBooking || !selectedSeat}
            onClick={goPayment}
          >
            {creatingBooking ? "Đang xử lý..." : "Tiếp tục thanh toán →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Booking;
