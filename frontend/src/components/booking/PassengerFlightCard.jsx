import { formatMoney, formatDate, formatTime } from "../../utils/format.js";
export default function PassengerFlightCard({
  flight,
  baseFlightPrice
}) {
  return <section className="passenger-card passenger-flight-card">
                <div className="passenger-card-title">
                  <div className="passenger-title-icon">✈</div>

                  <div>
                    <span>CHUYẾN BAY ĐÃ CHỌN</span>

                    <h2>
                      {flight.airline || "Hãng hàng không"}{" "}
                      {flight.flight_number || ""}
                    </h2>
                  </div>
                </div>

                <div className="passenger-flight-route">
                  <div className="passenger-airport">
                    <strong>
                      {flight.departure_code || flight.from || "---"}
                    </strong>

                    <span>{formatTime(flight.departure_time)}</span>
                  </div>

                  <div className="passenger-route-middle">
                    <small>Bay thẳng</small>

                    <div>────── ✈ ──────</div>
                  </div>

                  <div className="passenger-airport right">
                    <strong>{flight.arrival_code || flight.to || "---"}</strong>

                    <span>{formatTime(flight.arrival_time)}</span>
                  </div>
                </div>

                <div className="passenger-flight-footer">
                  <div>
                    <span>Ngày khởi hành</span>

                    <strong>{formatDate(flight.date)}</strong>
                  </div>

                  <div>
                    <span>Giá vé cơ bản</span>

                    <strong>{formatMoney(baseFlightPrice)}</strong>
                  </div>
                </div>
              </section>;
}
