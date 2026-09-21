import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import "../styles/Booking.css";

function Booking() {
  const location = useLocation();

  const navigate = useNavigate();

  const flight = location.state?.flight;

  const [customer, setCustomer] = useState({
    name: "",

    email: "",

    phone: "",
  });

  if (!flight) {
    return <div className="booking-empty">Không có thông tin chuyến bay</div>;
  }

  const handleChange = (e) => {
    setCustomer({
      ...customer,

      [e.target.name]: e.target.value,
    });
  };

  const continuePayment = () => {
    if (!customer.name || !customer.email || !customer.phone) {
      alert("Vui lòng nhập đầy đủ thông tin");

      return;
    }

    navigate(
      "/payment",

      {
        state: {
          flight,

          customer,
        },
      },
    );
  };

  return (
    <div className="booking-container">
      <h1>Thông tin đặt vé</h1>

      <div className="booking-flight-card">
        <h2>✈ {flight.airline}</h2>

        <p>
          Mã chuyến bay:
          <strong>{flight.flight_number}</strong>
        </p>

        <div className="booking-route">
          <div>
            <h3>{flight.from}</h3>

            <p>{flight.departure_time}</p>

            <span>Giờ xuất phát</span>
          </div>

          <div className="arrow">✈</div>

          <div>
            <h3>{flight.to}</h3>

            <p>{flight.arrival_time}</p>

            <span>Giờ đến</span>
          </div>
        </div>

        <div className="booking-price">
          Giá vé:
          <strong>{flight.price.toLocaleString("vi-VN")} VNĐ</strong>
        </div>
      </div>

      <div className="customer-form">
        <h2>Thông tin hành khách</h2>

        <input
          name="name"
          placeholder="Họ và tên"
          value={customer.name}
          onChange={handleChange}
        />

        <input
          name="email"
          placeholder="Email"
          value={customer.email}
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Số điện thoại"
          value={customer.phone}
          onChange={handleChange}
        />

        <button onClick={continuePayment}>Tiếp tục thanh toán</button>
      </div>
    </div>
  );
}

export default Booking;
