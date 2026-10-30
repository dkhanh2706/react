import { formatDate, formatTime, formatMoney } from "../../utils/format.js";
export default function BookingFlightCard({
  flight
}) {
  return <div className="summary-card flight-card-ticket">
                <div className="ticket-header">
                  <div className="ticket-airline">
                    <span className="plane-mini-badge">✈</span>

                    <div>
                      <h3>{flight.airline || "Hãng hàng không"}</h3>

                      <span className="pnr-badge">
                        Mã chuyến: {flight.flight_number || "---"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ticket-body">
                  <div className="ticket-route-row">
                    {/* FROM */}

                    <div className="route-col">
                      <span className="route-city-code">
                        {flight.departure_code || flight.from || "HAN"}
                      </span>

                      <strong className="route-time">
                        {formatTime(flight.departure_time)}
                      </strong>
                    </div>

                    {/* ROUTE */}

                    <div className="route-arrow-center">
                      <span className="arrow-text">Bay thẳng</span>

                      <div className="arrow-line">──────✈──────</div>
                    </div>

                    {/* TO */}

                    <div className="route-col text-right">
                      <span className="route-city-code">
                        {flight.arrival_code || flight.to || "SGN"}
                      </span>

                      <strong className="route-time">
                        {formatTime(flight.arrival_time)}
                      </strong>
                    </div>
                  </div>

                  {/* META */}

                  <div className="ticket-meta-grid">
                    <div className="meta-box">
                      <small>Ngày khởi hành</small>

                      <strong>{formatDate(flight.date, { fallback: "Chưa cập nhật" })}</strong>
                    </div>

                    <div className="meta-box">
                      <small>Giá vé gốc</small>

                      <strong>{formatMoney(flight.price)}</strong>
                    </div>
                  </div>
                </div>
              </div>;
}
