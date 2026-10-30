import { getMealName } from "../../utils/labels.js";
export default function PaymentServices({
  services
}) {
  return <div className="payment-methods-card" style={{
    marginTop: "18px"
  }}>
                <div className="payment-method-title">
                  <div>
                    <span className="payment-label">DỊCH VỤ ĐÃ CHỌN</span>

                    <h2>Hành lý & tiện ích</h2>
                  </div>
                </div>

                <div style={{
      display: "grid",
      gap: "14px",
      marginTop: "20px"
    }}>
                  <div className="price-row">
                    <span>🧳 Hành lý ký gửi</span>

                    <strong>
                      {Number(services.baggage_weight || 0) > 0 ? `${services.baggage_weight}kg` : "Không thêm"}
                    </strong>
                  </div>

                  <div className="price-row">
                    <span>🍱 Suất ăn</span>

                    <strong>{getMealName(services.meal_type)}</strong>
                  </div>

                  <div className="price-row">
                    <span>🛡️ Bảo hiểm</span>

                    <strong>{services.insurance ? "Có" : "Không"}</strong>
                  </div>
                </div>
              </div>;
}
