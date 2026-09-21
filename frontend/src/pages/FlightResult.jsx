import { useLocation, useNavigate } from "react-router-dom";

import "../styles/home.css";

function FlightResult() {
  const location = useLocation();

  const navigate = useNavigate();

  const flights = location.state?.flights || [];

  return (
    <div className="flight-result">
      <h1>✈️ Danh sách chuyến bay</h1>

      {flights.length === 0 ? (
        <p>Không tìm thấy chuyến bay</p>
      ) : (
        <div className="result-list">
          {flights.map((item) => (
            <div className="result-card" key={item.id}>
              <div className="flight-header">
                <h2>{item.flight_number}</h2>

                <span>{item.airline}</span>
              </div>

              <div className="route">
                <div>
                  <h3>{item.departure_code}</h3>

                  <p>{item.departure_city}</p>
                </div>

                <div className="plane">✈️</div>

                <div>
                  <h3>{item.arrival_code}</h3>

                  <p>{item.arrival_city}</p>
                </div>
              </div>

              <div className="time">
                <p>
                  🕒
                  {new Date(item.departure_time).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  -
                  {new Date(item.arrival_time).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="price">
                {Number(item.price).toLocaleString("vi-VN")}đ
              </div>

              <button
                onClick={() => {
                  navigate("/booking", {
                    state: {
                      flight: item,
                    },
                  });
                }}
              >
                Chọn chuyến bay
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FlightResult;
