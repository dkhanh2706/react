import { formatDate } from "../../utils/format.js";
import { getGenderName } from "../../utils/labels.js";
export default function PaymentPassengerCard({
  passenger
}) {
  return <div className="payment-methods-card">
                <div className="payment-method-title">
                  <div>
                    <span className="payment-label">THÔNG TIN HÀNH KHÁCH</span>

                    <h2>{passenger.full_name || "---"}</h2>
                  </div>

                  <div style={{
        fontSize: "34px"
      }}>👤</div>
                </div>

                <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "14px",
      marginTop: "20px"
    }}>
                  <div>
                    <small>Giới tính</small>
                    <div>
                      <strong>{getGenderName(passenger.gender)}</strong>
                    </div>
                  </div>

                  <div>
                    <small>Ngày sinh</small>
                    <div>
                      <strong>{formatDate(passenger.date_of_birth)}</strong>
                    </div>
                  </div>

                  <div>
                    <small>Giấy tờ tùy thân</small>
                    <div>
                      <strong>
                        {passenger.document_type || "---"}:{" "}
                        {passenger.document_number || "---"}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <small>Điện thoại</small>
                    <div>
                      <strong>{passenger.phone || "---"}</strong>
                    </div>
                  </div>

                  <div style={{
        gridColumn: "1 / -1"
      }}>
                    <small>Email</small>
                    <div>
                      <strong>{passenger.email || "---"}</strong>
                    </div>
                  </div>
                </div>
              </div>;
}
