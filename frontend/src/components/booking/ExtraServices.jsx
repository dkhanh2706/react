import { formatMoney } from "../../utils/format.js";
import { MEAL_OPTIONS } from "../../utils/passenger.js";
export default function ExtraServices({
  mealType,
  setMealType,
  insurance,
  setInsurance
}) {
  return <section className="passenger-card">
                <div className="passenger-section-heading">
                  <div>
                    <span className="passenger-section-number">3</span>

                    <div>
                      <h2>Dịch vụ bổ sung</h2>

                      <p>Bạn có thể bỏ qua nếu không có nhu cầu.</p>
                    </div>
                  </div>
                </div>

                {/* MEAL */}

                <div className="extra-service-block">
                  <div className="extra-service-heading">
                    <div className="extra-service-icon">🍱</div>

                    <div>
                      <strong>Suất ăn trên chuyến bay</strong>

                      <span>Lựa chọn suất ăn phù hợp</span>
                    </div>
                  </div>

                  <select className="meal-select" value={mealType} onChange={event => setMealType(event.target.value)}>
                    {MEAL_OPTIONS.map(item => <option key={item.value} value={item.value}>
                        {item.label}
                        {item.price > 0 ? ` - ${formatMoney(item.price)}` : ""}
                      </option>)}
                  </select>
                </div>

                {/* INSURANCE */}

                <button type="button" className={`insurance-option ${insurance ? "active" : ""}`} onClick={() => setInsurance(prev => !prev)}>
                  <span className={`insurance-checkbox ${insurance ? "checked" : ""}`}>
                    {insurance ? "✓" : ""}
                  </span>

                  <span className="insurance-icon">🛡️</span>

                  <span className="insurance-content">
                    <strong>Bảo hiểm chuyến bay</strong>

                    <small>Hỗ trợ bảo vệ hành trình của hành khách.</small>
                  </span>

                  <strong className="insurance-price">+50.000đ</strong>
                </button>
              </section>;
}
