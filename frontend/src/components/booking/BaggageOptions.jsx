import { formatMoney } from "../../utils/format.js";
import { BAGGAGE_OPTIONS } from "../../utils/passenger.js";
export default function BaggageOptions({
  baggageWeight,
  setBaggageWeight
}) {
  return <section className="passenger-card">
                <div className="passenger-section-heading">
                  <div>
                    <span className="passenger-section-number">2</span>

                    <div>
                      <h2>Hành lý ký gửi</h2>

                      <p>Chọn mức hành lý phù hợp với nhu cầu của bạn.</p>
                    </div>
                  </div>
                </div>

                <div className="baggage-options">
                  {BAGGAGE_OPTIONS.map(item => {
        const active = Number(baggageWeight) === Number(item.weight);
        return <button type="button" key={item.weight} className={`baggage-option ${active ? "active" : ""}`} onClick={() => setBaggageWeight(item.weight)}>
                        <span className="baggage-radio">
                          {active && <span />}
                        </span>

                        <span className="baggage-icon">🧳</span>

                        <span className="baggage-content">
                          <strong>{item.label}</strong>

                          <small>{item.description}</small>
                        </span>

                        <strong className="baggage-price">
                          {item.price === 0 ? "Miễn phí" : `+${formatMoney(item.price)}`}
                        </strong>
                      </button>;
      })}
                </div>
              </section>;
}
