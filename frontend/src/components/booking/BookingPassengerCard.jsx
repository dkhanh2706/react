import { formatDate } from "../../utils/format.js";
export default function BookingPassengerCard({
  passenger
}) {
  return <div className="summary-card">
                <h3>Thông tin hành khách</h3>

                <div style={{
      display: "grid",
      gap: "8px",
      fontSize: "13px"
    }}>
                  <div>
                    <strong>{passenger.full_name}</strong>
                  </div>

                  <div>
                    {passenger.gender === "MALE" ? "Nam" : passenger.gender === "FEMALE" ? "Nữ" : "Khác"}

                    {" • "}

                    {formatDate(passenger.date_of_birth, { fallback: "Chưa cập nhật" })}
                  </div>

                  <div>
                    {passenger.document_type}: {passenger.document_number}
                  </div>

                  <div>📞 {passenger.phone}</div>

                  <div>✉ {passenger.email}</div>
                </div>
              </div>;
}
