import { formatMoney } from "../../utils/format.js";
export default function PassengerPriceSummary({
  flight,
  baseFlightPrice,
  selectedBaggage,
  baggagePrice,
  selectedMeal,
  mealPrice,
  insurance,
  insurancePrice,
  temporaryPrice,
  handleContinue,
  navigate
}) {
  return <aside className="passenger-right">
              <div className="passenger-summary-card">
                <h2>Tóm tắt đặt vé</h2>

                <div className="passenger-summary-route">
                  <div>
                    <span>Chuyến bay</span>

                    <strong>
                      {flight.departure_code || flight.from || "---"} →{" "}
                      {flight.arrival_code || flight.to || "---"}
                    </strong>
                  </div>

                  <span className="summary-flight-number">
                    {flight.flight_number || "---"}
                  </span>
                </div>

                {/* PRICE */}

                <div className="passenger-price-list">
                  <div className="passenger-price-row">
                    <span>Giá vé cơ bản</span>

                    <strong>{formatMoney(baseFlightPrice)}</strong>
                  </div>

                  <div className="passenger-price-row">
                    <span>
                      Hành lý
                      {selectedBaggage.weight > 0 ? ` (${selectedBaggage.weight}kg)` : ""}
                    </span>

                    <strong>
                      {baggagePrice > 0 ? formatMoney(baggagePrice) : "0đ"}
                    </strong>
                  </div>

                  <div className="passenger-price-row">
                    <span>
                      Suất ăn
                      {selectedMeal.value !== "NONE" ? ` (${selectedMeal.label})` : ""}
                    </span>

                    <strong>
                      {mealPrice > 0 ? formatMoney(mealPrice) : "0đ"}
                    </strong>
                  </div>

                  <div className="passenger-price-row">
                    <span>Bảo hiểm</span>

                    <strong>
                      {insurance ? formatMoney(insurancePrice) : "0đ"}
                    </strong>
                  </div>
                </div>

                {/* TOTAL */}

                <div className="passenger-summary-total">
                  <span>Tạm tính</span>

                  <strong>{formatMoney(temporaryPrice)}</strong>
                </div>

                <div className="passenger-summary-note">
                  <span>ℹ</span>

                  <p>
                    Giá cuối cùng có thể thay đổi nếu bạn chọn ghế hạng Thương
                    gia ở bước tiếp theo.
                  </p>
                </div>

                <button type="button" className="passenger-continue-button" onClick={handleContinue}>
                  Tiếp tục chọn ghế
                  <span>→</span>
                </button>

                <button type="button" className="passenger-summary-back" onClick={() => navigate(-1)}>
                  ← Quay lại chọn chuyến
                </button>
              </div>
            </aside>;
}
