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
      passenger_name: "",
      email: "",
      phone: "",
      price: getPrice(),
    };

    try {
      const res = await axios.post("http://localhost:5000/api/bookings", data);
      console.log(res.data);
      navigate("/payment", { state: { booking: res.data } });
    } catch (error) {
      console.log(error);
      alert("Lỗi tạo booking");
    }
  };

  if (!flight) {
    return <h2>Không có dữ liệu chuyến bay</h2>;
  }

  // Nhóm ghế theo hạng để hiển thị đẹp hơn
  const businessSeats = seats.filter((s) => s.class === "BUSINESS");
  const economySeats = seats.filter((s) => s.class !== "BUSINESS");

  return (
    <div className="booking-container">
      <div className="booking-wrapper">
        <h1>Đặt chỗ chuyến bay</h1>

        {/* THÔNG TIN CHUYẾN BAY */}
        <div className="flight-info">
          <div className="flight-info-header">
            <h2>{flight.airline}</h2>
            <span className="flight-number">{flight.flight_number}</span>
          </div>
          <div className="flight-route">
            <div className="route-point">
              <span className="label">Điểm đi</span>
              <strong>{flight.from}</strong>
            </div>
            <div className="route-arrow">→</div>
            <div className="route-point">
              <span className="label">Điểm đến</span>
              <strong>{flight.to}</strong>
            </div>
          </div>
          <div className="flight-meta">
            <div>
              <span className="label">Ngày bay</span>
              <strong>{flight.date}</strong>
            </div>
            <div>
              <span className="label">Giờ bay</span>
              <strong>{flight.departure_time}</strong>
            </div>
            <div>
              <span className="label">Giá gốc</span>
              <strong className="price">
                {Number(flight.price).toLocaleString("vi-VN")}đ
              </strong>
            </div>
          </div>
        </div>

        {/* SƠ ĐỒ GHẾ */}
        <div className="seat-section">
          <div className="section-header">
            <h2>Chọn ghế</h2>
            <div className="seat-legend">
              <span>
                <i className="box business"></i> Thương gia
              </span>
              <span>
                <i className="box economy"></i> Phổ thông
              </span>
              <span>
                <i className="box selected"></i> Đang chọn
              </span>
            </div>
          </div>

          <div className="seat-area">
            {businessSeats.length > 0 && (
              <div className="seat-group">
                <p className="group-title">Hạng thương gia</p>
                <div className="seat-container">
                  {businessSeats.map((seat) => (
                    <button
                      key={seat.id}
                      className={
                        selectedSeat?.id === seat.id
                          ? "seat business selected"
                          : "seat business"
                      }
                      onClick={() => chooseSeat(seat)}
                    >
                      <span className="seat-number">{seat.seat_number}</span>
                      <small>{seat.class}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {economySeats.length > 0 && (
              <div className="seat-group">
                <p className="group-title">Hạng phổ thông</p>
                <div className="seat-container">
                  {economySeats.map((seat) => (
                    <button
                      key={seat.id}
                      className={
                        selectedSeat?.id === seat.id
                          ? "seat economy selected"
                          : "seat economy"
                      }
                      onClick={() => chooseSeat(seat)}
                    >
                      <span className="seat-number">{seat.seat_number}</span>
                      <small>{seat.class}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* THÔNG TIN GHẾ ĐÃ CHỌN */}
        {selectedSeat && (
          <div className="seat-info">
            <div>
              <span className="label">Ghế chọn</span>
              <strong>{selectedSeat.seat_number}</strong>
            </div>
            <div>
              <span className="label">Hạng</span>
              <strong>{selectedSeat.class}</strong>
            </div>
            <div>
              <span className="label">Thành tiền</span>
              <strong className="price">
                {getPrice().toLocaleString("vi-VN")}đ
              </strong>
            </div>
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
    </div>
  );
}

export default Booking;
