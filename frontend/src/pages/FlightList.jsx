import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Header from "../components/Header";
import Footer from "../components/Footer";

import "../styles/FlightList.css";

// =====================================================
// FORMAT HELPERS
// =====================================================

const formatMoney = (money) => {
  return Number(money || 0).toLocaleString("vi-VN") + " VNĐ";
};

const formatDate = (value) => {
  if (!value) return "---";
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split("-");
    return `${d}/${m}/${y}`;
  }
  return str;
};

const formatTime = (value) => {
  if (!value) return "--:--";
  const str = String(value);
  if (/^\d{2}:\d{2}$/.test(str)) return str;
  if (/^\d{2}:\d{2}:\d{2}/.test(str)) return str.slice(0, 5);
  return str;
};

function FlightList() {
  const location = useLocation();
  const navigate = useNavigate();

  const flights = location.state?.flights || [];

  // ==========================
  // CHỌN CHUYẾN BAY
  // ==========================
  const chooseFlight = (flight) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Vui lòng đăng nhập để đặt vé");
      setTimeout(() => {
        navigate("/login");
      }, 800);
      return;
    }

    navigate("/booking", {
      state: {
        flight: flight,
      },
    });
  };

  return (
    <div className="flight-list-page">
      <Header />

      <main className="flight-list-main">
        <div className="flight-list-inner">
          {/* TOP ACTIONS */}
          <div className="flight-list-topbar">
            <button
              type="button"
              className="flight-list-back-btn"
              onClick={() => navigate(-1)}
            >
              ← Quay lại
            </button>
            <span className="flight-list-count">
              Tìm thấy <strong>{flights.length}</strong> chuyến bay phù hợp
            </span>
          </div>

          <div className="flight-list-header">
            <h1>Danh sách chuyến bay khả dụng</h1>
            <p>Lựa chọn chuyến bay tốt nhất cho hành trình của bạn</p>
          </div>

          {flights.length === 0 ? (
            <div className="flight-list-empty">
              <div className="flight-empty-glyph">✈</div>
              <h3>Không tìm thấy chuyến bay phù hợp</h3>
              <p>Vui lòng thử tìm kiếm với điểm đi, điểm đến hoặc ngày khác.</p>
              <button
                type="button"
                className="btn-back-search"
                onClick={() => navigate("/destinations")}
              >
                Tìm chuyến bay khác
              </button>
            </div>
          ) : (
            <div className="flight-cards-container">
              {flights.map((flight) => (
                <div className="flight-card-modern" key={flight.id}>
                  {/* AIRLINE COLUMN */}
                  <div className="airline-block">
                    <div className="airline-icon-badge">✈</div>
                    <div>
                      <h2>{flight.airline}</h2>
                      <span className="flight-code-badge">
                        Mã: {flight.flight_number || "---"}
                      </span>
                    </div>
                  </div>

                  {/* ROUTE TIMELINE */}
                  <div className="route-timeline">
                    {/* DEPARTURE */}
                    <div className="route-stop">
                      <span className="stop-time">
                        {formatTime(flight.departure_time)}
                      </span>
                      <strong className="stop-code">
                        {flight.departure_code || flight.from}
                      </strong>
                      <span className="stop-date">{formatDate(flight.date)}</span>
                    </div>

                    {/* DURATION / PATH */}
                    <div className="route-path">
                      <span className="route-badge">
                        {flight.type || "Bay thẳng"}
                      </span>
                      <div className="route-line-graphic">
                        <span className="dot" />
                        <span className="dash-line" />
                        <span className="plane-mini">✈</span>
                        <span className="dash-line" />
                        <span className="dot" />
                      </div>
                    </div>

                    {/* ARRIVAL */}
                    <div className="route-stop">
                      <span className="stop-time">
                        {formatTime(flight.arrival_time)}
                      </span>
                      <strong className="stop-code">
                        {flight.arrival_code || flight.to}
                      </strong>
                      <span className="stop-date">{formatDate(flight.date)}</span>
                    </div>
                  </div>

                  {/* PRICE & ACTION */}
                  <div className="price-action-block">
                    <div className="price-tag">
                      <small>Giá mỗi vé từ</small>
                      <h3>{formatMoney(flight.price)}</h3>
                    </div>
                    <button
                      type="button"
                      className="btn-select-flight"
                      onClick={() => chooseFlight(flight)}
                    >
                      Chọn vé ngay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default FlightList;
