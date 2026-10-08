import { useEffect, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import api from "../api/axios";

import "../styles/Booking.css";

function Booking() {
  const location = useLocation();

  const navigate = useNavigate();

  // =====================================================
  // CHUYẾN BAY ĐƯỢC CHỌN TỪ FLIGHT LIST
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
  // KIỂM TRA LOGIN
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
  // LOAD GHẾ
  // =====================================================

  useEffect(() => {
    if (!flight?.id) {
      return;
    }

    const fetchSeats = async () => {
      try {
        setLoadingSeats(true);

        const res = await api.get(`/seats/flight/${flight.id}`);

        console.log("Danh sách ghế:", res.data);

        const seatData = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        setSeats(seatData);
      } catch (error) {
        console.error("Lỗi tải danh sách ghế:", error.response?.data || error);

        toast.error("Không thể tải danh sách ghế");
      } finally {
        setLoadingSeats(false);
      }
    };

    fetchSeats();
  }, [flight]);

  // =====================================================
  // RELOAD GHẾ
  // =====================================================

  const reloadSeats = async () => {
    if (!flight?.id) {
      return;
    }

    try {
      const res = await api.get(`/seats/flight/${flight.id}`);

      const seatData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      setSeats(seatData);
    } catch (error) {
      console.error("Lỗi reload ghế:", error.response?.data || error);
    }
  };

  // =====================================================
  // CHỌN GHẾ
  // HOLD 15 PHÚT
  // =====================================================

  const chooseSeat = async (seat) => {
    if (seat.status === "BOOKED") {
      toast.error("Ghế này đã có người đặt");

      return;
    }

    if (seat.status === "HOLD") {
      toast.error("Ghế này đang được người khác giữ");

      return;
    }

    try {
      // ==========================================
      // BODY KHÔNG CẦN USER_ID
      // BACKEND LẤY TỪ JWT
      // ==========================================

      const holdData = {
        flight_id: flight.id,

        seat_id: seat.id,

        seat_class: seat.class,
      };

      console.log("HOLD PAYLOAD:", holdData);

      const res = await api.post("/bookings/hold-seat", holdData);

      console.log("HOLD SUCCESS:", res.data);

      // ==========================================
      // GHẾ ĐANG CHỌN
      // ==========================================

      setSelectedSeat({
        ...seat,

        hold_expires_at: res.data?.hold_expires_at,
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
  // TÍNH GIÁ
  // =====================================================

  const totalPrice = () => {
    let price = Number(flight?.price || 0);

    // BUSINESS = 150%
    if (selectedSeat?.class === "BUSINESS") {
      price = price * 1.5;
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

      // ==========================================
      // DỮ LIỆU GỬI BACKEND
      // ==========================================

      const bookingData = {
        // ----------------------------------------
        // ID
        // ----------------------------------------

        flight_id: flight.id,

        seat_id: selectedSeat.id,

        seat_class: selectedSeat.class,

        price: totalPrice(),

        // ----------------------------------------
        // SNAPSHOT CHUYẾN BAY
        // ----------------------------------------

        flight_date: flight.date || null,

        departure_place: flight.from || null,

        arrival_place: flight.to || null,

        departure_time: flight.departure_time || null,

        arrival_time: flight.arrival_time || null,

        airline: flight.airline || null,

        flight_number: flight.flight_number || null,

        seat_number: selectedSeat.seat_number || null,
      };

      console.log("BOOKING PAYLOAD:", bookingData);

      // ==========================================
      // CREATE BOOKING
      // ==========================================

      const res = await api.post("/bookings", bookingData);

      console.log("BOOKING SUCCESS:", res.data);

      // ==========================================
      // PAYMENT PAGE
      // ==========================================

      navigate("/payment", {
        state: {
          flight,

          seat: selectedSeat,

          booking: res.data.booking,

          price: totalPrice(),

          hold_expires_at:
            res.data.hold_expires_at || selectedSeat.hold_expires_at,
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
  // KHÔNG CÓ CHUYẾN BAY
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
  // PHÂN LOẠI GHẾ
  // =====================================================

  const businessSeats = seats.filter((seat) => seat.class === "BUSINESS");

  const economySeats = seats.filter((seat) => seat.class === "ECONOMY");

  // =====================================================
  // RENDER GHẾ
  // =====================================================

  const renderSeat = (seat) => {
    const isBooked = seat.status === "BOOKED";

    const isHold = seat.status === "HOLD";

    const isSelected = selectedSeat?.id === seat.id;

    let seatClass;

    if (isSelected) {
      seatClass = "seat selected";
    } else if (isBooked) {
      seatClass = "seat booked";
    } else if (isHold) {
      seatClass = "seat held";
    } else if (seat.class === "BUSINESS") {
      seatClass = "seat business";
    } else {
      seatClass = "seat economy";
    }

    return (
      <button
        key={seat.id}
        type="button"
        disabled={(isBooked || isHold) && !isSelected}
        className={seatClass}
        onClick={() => {
          if (!isSelected) {
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
                : seat.class}
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

        {/* ==========================================
            THÔNG TIN CHUYẾN
        ========================================== */}

        <div className="flight-info">
          <h2>{flight.airline}</h2>

          <p>
            {flight.from}
            {" → "}
            {flight.to}
          </p>

          <p>
            Mã chuyến: <strong>{flight.flight_number}</strong>
          </p>

          <p>
            Ngày bay: <strong>{flight.date}</strong>
          </p>

          <p>
            Giờ bay: <strong>{flight.departure_time}</strong>
            {flight.arrival_time && (
              <>
                {" → "}

                <strong>{flight.arrival_time}</strong>
              </>
            )}
          </p>

          <h3>{Number(flight.price || 0).toLocaleString("vi-VN")}đ</h3>
        </div>

        {/* ==========================================
            CHỌN GHẾ
        ========================================== */}

        <div className="seat-section">
          <h2>Chọn ghế</h2>

          {loadingSeats ? (
            <p>Đang tải danh sách ghế...</p>
          ) : (
            <>
              {/* BUSINESS */}

              <h3>BUSINESS</h3>

              {businessSeats.length > 0 ? (
                <div className="seat-container">
                  {businessSeats.map(renderSeat)}
                </div>
              ) : (
                <p>Không có ghế Business.</p>
              )}

              {/* ECONOMY */}

              <h3>ECONOMY</h3>

              {economySeats.length > 0 ? (
                <div className="seat-container">
                  {economySeats.map(renderSeat)}
                </div>
              ) : (
                <p>Không có ghế Economy.</p>
              )}
            </>
          )}
        </div>

        {/* ==========================================
            GHẾ ĐÃ CHỌN
        ========================================== */}

        {selectedSeat && (
          <div className="seat-info">
            <h3>Ghế: {selectedSeat.seat_number}</h3>

            <p>Hạng: {selectedSeat.class}</p>

            <p>Giá: {totalPrice().toLocaleString("vi-VN")}đ</p>

            <p>⏳ Ghế được giữ trong 15 phút</p>
          </div>
        )}

        {/* ==========================================
            ACTION
        ========================================== */}

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
