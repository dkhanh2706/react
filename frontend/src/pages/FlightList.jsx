import { useLocation, useNavigate } from "react-router-dom";
import "../styles/FlightList.css";

function FlightList() {
  const location = useLocation();

  const navigate = useNavigate();

  const flights = location.state?.flights || [];

  const formatMoney = (money) => {
    return money.toLocaleString("vi-VN") + " VNĐ";
  };

  const chooseFlight = (flight) => {
    navigate(
      "/booking",

      {
        state: {
          flight: flight,
        },
      },
    );
  };

  return (
    <div className="flight-result-container">
      <h1>Kết quả tìm kiếm chuyến bay</h1>

      {flights.length === 0 ? (
        <div className="empty">Không tìm thấy chuyến bay phù hợp</div>
      ) : (
        flights.map((flight) => (
          <div className="flight-card" key={flight.id}>
            <div className="airline">
              <h2>✈ {flight.airline}</h2>

              <p>
                Mã chuyến bay:
                <strong>{flight.flight_number}</strong>
              </p>
            </div>

            <div className="flight-route">
              <div className="airport">
                <h3>{flight.from}</h3>

                <p>Ngày bay:</p>

                <strong>{flight.date}</strong>

                <p>{flight.departure_time}</p>

                <span>Điểm đi</span>
              </div>

              <div className="line">
                <div>●────────✈────────●</div>

                <p>{flight.type}</p>
              </div>

              <div className="airport">
                <h3>{flight.to}</h3>

                <p>Ngày đến:</p>

                <strong>{flight.date}</strong>

                <p>{flight.arrival_time}</p>

                <span>Điểm đến</span>
              </div>
            </div>

            <div className="price-box">
              <h2>{formatMoney(flight.price)}</h2>

              <button onClick={() => chooseFlight(flight)}>CHỌN</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default FlightList;
