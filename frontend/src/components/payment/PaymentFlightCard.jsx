import { formatDate, formatTime } from "../../utils/format.js";
export default function PaymentFlightCard({
  flight,
  seat
}) {
  return <div className="summary-flight-block">
                  <div className="flight-title-row">
                    <span className="airline-name">
                      {flight.airline || "Hãng bay"}
                    </span>

                    <span className="flight-no">
                      Chuyến {flight.flight_number || "---"}
                    </span>
                  </div>

                  <div className="flight-route-display">
                    <div>
                      <strong>
                        {flight.from || flight.departure_code || "---"}
                      </strong>

                      <small>{formatTime(flight.departure_time)}</small>
                    </div>

                    <div className="route-arrow-icon">─── ✈ ───</div>

                    <div className="text-right">
                      <strong>
                        {flight.to || flight.arrival_code || "---"}
                      </strong>

                      <small>{formatTime(flight.arrival_time)}</small>
                    </div>
                  </div>

                  <div className="flight-meta-details">
                    <div>
                      <span>Ngày bay:</span>

                      <strong>{formatDate(flight.date)}</strong>
                    </div>

                    <div>
                      <span>Ghế:</span>

                      <strong className="seat-highlight">
                        {seat.seat_number || "---"} ({seat.class || "ECONOMY"})
                      </strong>
                    </div>
                  </div>
                </div>;
}
