import { useLocation, useNavigate } from "react-router-dom";

import Header from "../components/Header";

import "../styles/FlightResult.css";

// =====================================================
// ICON
// =====================================================

const Icon = ({ children, size = 20 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const ArrowLeftIcon = () => (
  <Icon size={18}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </Icon>
);

const PlaneIcon = () => (
  <Icon size={18}>
    <path d="M10.5 13.5 3 11l1.5-1.5 9 .5 4.5-4.5a1.8 1.8 0 0 1 2.6 2.6L15.1 12.6l.5 9L14 22.9l-2.5-7.4" />
  </Icon>
);

const CalendarIcon = () => (
  <Icon size={17}>
    <rect x="3" y="5" width="18" height="16" rx="2" />

    <path d="M16 3v4M8 3v4M3 10h18" />
  </Icon>
);

// =====================================================
// FORMAT DATE
// =====================================================

const safeDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const formatTime = (value) => {
  const date = safeDate(value);

  if (!date) {
    return "--:--";
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  const date = safeDate(value);

  if (!date) {
    return "Chưa cập nhật";
  }

  return date.toLocaleDateString("vi-VN");
};

// =====================================================
// FLIGHT RESULT
// =====================================================

function FlightResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const flights = location.state?.flights || [];

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/home");
  };

  const handleSelectFlight = (item) => {
    console.log("Flight selected:", item);

    navigate("/booking", {
      state: {
        flight: item,
      },
    });
  };

  return (
    <div className="flight-result-page">
      <Header />

      <main className="flight-result-main">
        <div className="flight-result-inner">
          {/* TOP BAR */}
          <div className="flight-result-topbar">
            <button
              type="button"
              className="flight-back-button"
              onClick={handleBack}
            >
              <ArrowLeftIcon />

              <span>Quay lại</span>
            </button>
          </div>

          {/* HEADING */}
          <div className="flight-result-heading">
            <div className="flight-result-heading-icon">
              <PlaneIcon />
            </div>

            <div>
              <h1>Danh sách chuyến bay</h1>

              <p>Chọn chuyến bay phù hợp với lịch trình của bạn.</p>
            </div>
          </div>

          {/* EMPTY */}
          {flights.length === 0 ? (
            <div className="flight-empty-state">
              <div className="flight-empty-icon">✈</div>

              <h2>Không tìm thấy chuyến bay</h2>

              <p>Hãy quay lại và thử tìm với ngày bay hoặc hành trình khác.</p>

              <button type="button" onClick={() => navigate("/home")}>
                Tìm chuyến bay khác
              </button>
            </div>
          ) : (
            <div className="flight-result-list">
              {flights.map((item) => (
                <article
                  className="flight-result-card"
                  key={item.id || item.flight_number}
                >
                  {/* AIRLINE */}
                  <div className="flight-airline-block">
                    <div className="flight-airline-icon">✈</div>

                    <div className="flight-airline-info">
                      <span className="flight-airline-label">Hãng bay</span>

                      <h2>{item.airline || "Airline"}</h2>

                      <p>
                        Mã chuyến <strong>{item.flight_number || "---"}</strong>
                      </p>
                    </div>
                  </div>

                  {/* ROUTE */}
                  <div className="flight-route-block">
                    {/* DEPARTURE */}
                    <div className="flight-airport">
                      <span className="flight-airport-time">
                        {formatTime(item.departure_time)}
                      </span>

                      <h3>{item.departure_code || "---"}</h3>

                      <p>{item.departure_city || ""}</p>
                    </div>

                    {/* LINE */}
                    <div className="flight-route-line">
                      <span className="flight-route-label">Bay thẳng</span>

                      <div className="flight-route-line-bar">
                        <span className="route-dot" />

                        <span className="route-track">
                          <span className="route-plane">✈</span>
                        </span>

                        <span className="route-dot" />
                      </div>
                    </div>

                    {/* ARRIVAL */}
                    <div className="flight-airport flight-airport-arrival">
                      <span className="flight-airport-time">
                        {formatTime(item.arrival_time)}
                      </span>

                      <h3>{item.arrival_code || "---"}</h3>

                      <p>{item.arrival_city || ""}</p>
                    </div>
                  </div>

                  {/* DATE */}
                  <div className="flight-date-block">
                    <div className="flight-date-icon">
                      <CalendarIcon />
                    </div>

                    <div>
                      <span>Ngày bay</span>

                      <strong>{formatDate(item.departure_time)}</strong>
                    </div>
                  </div>

                  {/* PRICE */}
                  <div className="flight-price-block">
                    <span className="flight-price-label">Giá vé</span>

                    <strong className="flight-price">
                      {Number(item.price || 0).toLocaleString("vi-VN")}đ
                    </strong>

                    <button
                      type="button"
                      className="flight-select-button"
                      onClick={() => handleSelectFlight(item)}
                    >
                      Chọn chuyến bay
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default FlightResult;
