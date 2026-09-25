import { useLocation, useNavigate } from "react-router-dom";

import "../styles/home.css";

function FlightResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const flights = location.state?.flights || [];

  return (
    <div className="flight-result-container">
      <h1>✈️ Danh sách chuyến bay</h1>

      {flights.length === 0 ? (
        <div className="empty">Không tìm thấy chuyến bay</div>
      ) : (
        flights.map((item) => (
          <div className="flight-card" key={item.id}>
            {/* Cột hãng bay */}
            <div className="airline">
              <h2>✈️ {item.airline}</h2>
              <p>
                Mã chuyến
                <strong>{item.flight_number}</strong>
              </p>
            </div>

            {/* Lộ trình */}
            <div className="flight-route">
              <div className="airport">
                <h3>{item.departure_code}</h3>
                <p>{item.departure_city}</p>
                <strong>
                  {new Date(item.departure_time).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
              </div>

              <div className="line">
                <div>✈ ───────</div>
                <p>Bay thẳng</p>
              </div>

              <div className="airport">
                <h3>{item.arrival_code}</h3>
                <p>{item.arrival_city}</p>
                <strong>
                  {new Date(item.arrival_time).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
              </div>
            </div>

            {/* Giá + nút chọn */}
            <div className="price-box">
              <h2>{Number(item.price).toLocaleString("vi-VN")}đ</h2>
              <button
                onClick={() =>
                  navigate("/booking", { state: { flight: item } })
                }
              >
                Chọn chuyến bay
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default FlightResult;
