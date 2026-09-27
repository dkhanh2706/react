import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import "../styles/Booking.css";

function Booking() {
  const location = useLocation();

  const navigate = useNavigate();

  const flight = location.state?.flight;

  const [seats, setSeats] = useState([]);

  const [selectedSeat, setSelectedSeat] = useState(null);

  // ==========================
  // LOAD GHẾ BAN ĐẦU
  // ==========================

  useEffect(() => {
    if (!flight?.id) {
      return;
    }

    const fetchSeats = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/seats/flight/${flight.id}`,
        );

        setSeats(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchSeats();
  }, [flight]);

  // ==========================
  // LOAD LẠI GHẾ
  // ==========================

  const reloadSeats = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/seats/flight/${flight.id}`,
      );

      setSeats(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  // ==========================
  // CHỌN GHẾ
  // ==========================

  const chooseSeat = async (seat) => {
    if (seat.status === "BOOKED") {
      alert("Ghế này đã có người đặt");

      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/bookings/hold-seat",

        {
          flight_id: flight.id,

          seat_id: seat.id,

          seat_class: seat.class,
        },
      );

      setSelectedSeat(seat);

      reloadSeats();
    } catch (error) {
      alert(error.response?.data?.message || "Ghế này đã được chọn");

      reloadSeats();
    }
  };

  // ==========================
  // TÍNH TIỀN
  // ==========================

  const totalPrice = () => {
    let price = Number(flight.price);

    if (selectedSeat?.class === "BUSINESS") {
      price = price * 1.5;
    }

    return price;
  };

  // ==========================
  // ĐẶT VÉ + SANG PAYMENT
  // ==========================

  const goPayment = async () => {
    if (!selectedSeat) {
      alert("Vui lòng chọn ghế");

      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/bookings",

        {
          user_id: 1,

          flight_id: flight.id,

          seat_id: selectedSeat.id,

          seat_class: selectedSeat.class,

          price: totalPrice(),
        },
      );

      navigate(
        "/payment",

        {
          state: {
            flight,

            seat: selectedSeat,

            booking: res.data.booking,

            price: totalPrice(),
          },
        },
      );
    } catch (error) {
      alert(error.response?.data?.message || "Không thể tạo booking");

      reloadSeats();
    }
  };

  if (!flight) {
    return <h2>Không có dữ liệu chuyến bay</h2>;
  }

  const businessSeats = seats.filter((seat) => seat.class === "BUSINESS");

  const economySeats = seats.filter((seat) => seat.class === "ECONOMY");

  const renderSeat = (seat) => {
    return (
      <button
        key={seat.id}
        disabled={seat.status === "BOOKED"}
        className={
          seat.status === "BOOKED"
            ? "seat booked"
            : selectedSeat?.id === seat.id
              ? "seat selected"
              : seat.class === "BUSINESS"
                ? "seat business"
                : "seat economy"
        }
        onClick={() => chooseSeat(seat)}
      >
        <b>{seat.seat_number}</b>

        <small>{seat.status === "BOOKED" ? "Đã đặt" : seat.class}</small>
      </button>
    );
  };

  return (
    <div className="booking-container">
      <div className="booking-wrapper">
        <h1>✈ Đặt chỗ chuyến bay</h1>

        <div className="flight-info">
          <h2>{flight.airline}</h2>

          <p>
            {flight.from}→{flight.to}
          </p>

          <p>
            Mã chuyến:
            {flight.flight_number}
          </p>

          <p>
            Ngày bay:
            {flight.date}
          </p>

          <p>
            Giờ bay:
            {flight.departure_time}
          </p>

          <h3>{Number(flight.price).toLocaleString("vi-VN")}đ</h3>
        </div>

        <div className="seat-section">
          <h2>Chọn ghế</h2>

          <h3>BUSINESS</h3>

          <div className="seat-container">{businessSeats.map(renderSeat)}</div>

          <h3>ECONOMY</h3>

          <div className="seat-container">{economySeats.map(renderSeat)}</div>
        </div>

        {selectedSeat && (
          <div className="seat-info">
            <h3>
              Ghế:
              {selectedSeat.seat_number}
            </h3>

            <p>
              Hạng:
              {selectedSeat.class}
            </p>

            <p>
              Giá:
              {totalPrice().toLocaleString("vi-VN")}đ
            </p>
          </div>
        )}

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
