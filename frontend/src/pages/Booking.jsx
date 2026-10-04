import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../api/axios";
import "../styles/Booking.css";

function Booking() {
  const location = useLocation();
  const navigate = useNavigate();

  const flight = location.state?.flight;

  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);

  // ==========================
  // KIỂM TRA ĐĂNG NHẬP
  // ==========================
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Vui lòng đăng nhập để đặt vé");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    }
  }, [navigate]);

  // ==========================
  // LOAD GHẾ BAN ĐẦU
  // ==========================
  useEffect(() => {
    if (!flight?.id) {
      return;
    }

    const fetchSeats = async () => {
      try {
        const res = await api.get(`/seats/flight/${flight.id}`);

        console.log("Danh sách ghế:", res.data);

        setSeats(res.data);
      } catch (error) {
        console.error("Lỗi tải danh sách ghế:", error.response?.data || error);

        toast.error("Không thể tải danh sách ghế");
      }
    };

    fetchSeats();
  }, [flight]);

  // ==========================
  // LOAD LẠI GHẾ
  // ==========================
  const reloadSeats = async () => {
    if (!flight?.id) {
      return;
    }

    try {
      const res = await api.get(`/seats/flight/${flight.id}`);

      setSeats(res.data);
    } catch (error) {
      console.error("Lỗi reload ghế:", error.response?.data || error);
    }
  };

  // ==========================
  // CHỌN GHẾ + HOLD 15 PHÚT
  // ==========================
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
      // ==========================
      // LẤY USER ĐANG ĐĂNG NHẬP
      // ==========================
      const userData = localStorage.getItem("user");

      if (!userData) {
        toast.error("Không tìm thấy thông tin tài khoản");

        navigate("/login");

        return;
      }

      const user = JSON.parse(userData);

      if (!user?.id) {
        console.error("User trong localStorage:", user);

        toast.error("Thông tin tài khoản không hợp lệ");

        return;
      }

      // ==========================
      // DỮ LIỆU HOLD
      // ==========================
      const holdData = {
        user_id: user.id,
        flight_id: flight.id,
        seat_id: seat.id,
        seat_class: seat.class,
      };

      console.log("HOLD PAYLOAD:", holdData);

      // ==========================
      // GỬI API HOLD
      // ==========================
      const res = await api.post("/bookings/hold-seat", holdData);

      console.log("HOLD SUCCESS:", res.data);

      // ==========================
      // LƯU GHẾ ĐANG CHỌN
      // ==========================
      setSelectedSeat({
        ...seat,
        hold_expires_at: res.data.hold_expires_at,
      });

      toast.success(`Đã giữ ghế ${seat.seat_number} trong 15 phút`);

      // ==========================
      // LOAD LẠI TRẠNG THÁI GHẾ
      // ==========================
      await reloadSeats();
    } catch (error) {
      console.error("Lỗi giữ ghế:", error.response?.data || error);

      toast.error(error.response?.data?.message || "Không thể giữ ghế");

      await reloadSeats();
    }
  };

  // ==========================
  // TÍNH TIỀN
  // ==========================
  const totalPrice = () => {
    let price = Number(flight?.price || 0);

    if (selectedSeat?.class === "BUSINESS") {
      price = price * 1.5;
    }

    return price;
  };

  // ==========================
  // TẠO BOOKING
  // CHUYỂN PAYMENT
  // ==========================
  const goPayment = async () => {
    if (!selectedSeat) {
      toast.error("Vui lòng chọn ghế");
      return;
    }

    try {
      // ==========================
      // LẤY USER
      // ==========================
      const userData = localStorage.getItem("user");

      if (!userData) {
        toast.error("Không tìm thấy thông tin tài khoản");

        navigate("/login");

        return;
      }

      const user = JSON.parse(userData);

      if (!user?.id) {
        toast.error("Thông tin tài khoản không hợp lệ");

        return;
      }

      // ==========================
      // DỮ LIỆU BOOKING
      // ==========================
      const bookingData = {
        user_id: user.id,
        flight_id: flight.id,
        seat_id: selectedSeat.id,
        seat_class: selectedSeat.class,
        price: totalPrice(),
      };

      console.log("BOOKING PAYLOAD:", bookingData);

      // ==========================
      // TẠO BOOKING
      // ==========================
      const res = await api.post("/bookings", bookingData);

      console.log("BOOKING SUCCESS:", res.data);

      // ==========================
      // CHUYỂN QUA PAYMENT
      // ==========================
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
    }
  };

  // ==========================
  // KHÔNG CÓ CHUYẾN BAY
  // ==========================
  if (!flight) {
    return <h2>Không có dữ liệu chuyến bay</h2>;
  }

  // ==========================
  // PHÂN LOẠI GHẾ
  // ==========================
  const businessSeats = seats.filter((seat) => seat.class === "BUSINESS");

  const economySeats = seats.filter((seat) => seat.class === "ECONOMY");

  // ==========================
  // HIỂN THỊ GHẾ
  // ==========================
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

  // ==========================
  // GIAO DIỆN
  // ==========================
  return (
    <div className="booking-container">
      <div className="booking-wrapper">
        <h1>✈ Đặt chỗ chuyến bay</h1>

        {/* ==========================
            THÔNG TIN CHUYẾN BAY
        ========================== */}

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
          </p>

          <h3>{Number(flight.price).toLocaleString("vi-VN")}đ</h3>
        </div>

        {/* ==========================
            CHỌN GHẾ
        ========================== */}

        <div className="seat-section">
          <h2>Chọn ghế</h2>

          {/* ==========================
              BUSINESS
          ========================== */}

          <h3>BUSINESS</h3>

          <div className="seat-container">{businessSeats.map(renderSeat)}</div>

          {/* ==========================
              ECONOMY
          ========================== */}

          <h3>ECONOMY</h3>

          <div className="seat-container">{economySeats.map(renderSeat)}</div>
        </div>

        {/* ==========================
            THÔNG TIN GHẾ ĐÃ CHỌN
        ========================== */}

        {selectedSeat && (
          <div className="seat-info">
            <h3>Ghế: {selectedSeat.seat_number}</h3>

            <p>Hạng: {selectedSeat.class}</p>

            <p>Giá: {totalPrice().toLocaleString("vi-VN")}đ</p>

            <p>⏳ Ghế được giữ trong 15 phút</p>
          </div>
        )}

        {/* ==========================
            NÚT CHỨC NĂNG
        ========================== */}

        <div className="booking-actions">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>

          <button className="payment-button" onClick={goPayment}>
            Tiếp tục thanh toán →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Booking;
