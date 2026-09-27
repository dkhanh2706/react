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
  // LOAD GHẾ
  // ==========================

  useEffect(() => {
    if (!flight?.airplane_id) return;

    const getSeats = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/seats/airplane/${flight.airplane_id}`,
        );

        console.log("SEATS:", res.data);

        setSeats(res.data);
      } catch (error) {
        console.log("Lỗi lấy ghế:", error);
      }
    };

    getSeats();
  }, [flight?.airplane_id]);

  // ==========================
  // CHỌN GHẾ
  // ==========================

  const chooseSeat = (seat) => {
    setSelectedSeat(seat);
  };

  // ==========================
  // TÍNH GIÁ
  // ==========================

  const getPrice = () => {
    let price = Number(flight.price);

    // thương gia +50%

    if (selectedSeat?.class === "BUSINESS") {
      price = price * 1.5;
    }

    return price;
  };

  // ==========================
  // TẠO BOOKING
  // ==========================

  const submitBooking = async () => {
    if (!selectedSeat) {
      alert("Vui lòng chọn ghế");

      return;
    }

    const data = {
      user_id: 1,

      flight_id: flight.id,

      seat_id: selectedSeat.id,

      seat_class: selectedSeat.class,

      // bỏ thông tin khách hàng

      passenger_name: "",

      email: "",

      phone: "",

      price: getPrice(),
    };

    try {
      const res = await axios.post(
        "http://localhost:5000/api/bookings",

        data,
      );

      console.log(res.data);

      navigate("/payment", {
        state: {
          booking: res.data,
        },
      });
    } catch (error) {
      console.log(error);

      alert("Lỗi tạo booking");
    }
  };

  if (!flight) {
    return <h2>Không có dữ liệu chuyến bay</h2>;
  }

  return (
    <div className="booking-container">
      <h1>Đặt chỗ chuyến bay</h1>

      {/* THÔNG TIN CHUYẾN BAY */}

      <div className="flight-info">
        <h2>{flight.airline}</h2>

        <p>
          {flight.from}
          {" → "}
          {flight.to}
        </p>

        <p>Mã chuyến: {flight.flight_number}</p>

        <p>Ngày bay: {flight.date}</p>

        <p>Giờ bay: {flight.departure_time}</p>

        <p>
          Giá gốc:
          {Number(flight.price).toLocaleString("vi-VN")}đ
        </p>
      </div>

      {/* SƠ ĐỒ GHẾ */}

      <h2>Chọn ghế</h2>

      <div className="seat-container">
        {seats.map((seat) => (
          <button
            key={seat.id}
            className={selectedSeat?.id === seat.id ? "seat selected" : "seat"}
            onClick={() => chooseSeat(seat)}
          >
            {seat.seat_number}

            <br />

            <small>{seat.class}</small>
          </button>
        ))}
      </div>

      {selectedSeat && (
        <div className="seat-info">
          <h3>
            Ghế chọn:
            {selectedSeat.seat_number}
          </h3>

          <h3>
            Hạng:
            {selectedSeat.class}
          </h3>

          <h3>
            Thành tiền:
            {getPrice().toLocaleString("vi-VN")}đ
          </h3>
        </div>
      )}

      {/* BUTTON */}

      <div className="booking-actions">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>

        <button className="payment-button" onClick={submitBooking}>
          Tiếp tục thanh toán →
        </button>
      </div>
    </div>
  );
}

export default Booking;
