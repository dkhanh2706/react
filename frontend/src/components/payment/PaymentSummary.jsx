import PaymentFlightCard from "./PaymentFlightCard.jsx";
import { formatMoney } from "../../utils/format.js";
export default function PaymentSummary({
  booking,
  flight,
  seat,
  basePrice,
  seatSurcharge,
  baggagePrice,
  services,
  mealPrice,
  insurancePrice,
  totalPrice,
  data,
  navigate,
  demoEnabled,
  paying,
  mockPaying,
  handleMockPayment,
  handleMomoPayment
}) {
  return <div className="order-summary-card">
                <h2>Tóm tắt vé máy bay</h2>

                <div className="booking-code-row">
                  <span>Mã đặt chỗ</span>

                  <strong>
                    {booking.booking_code || `#${booking.id || "---"}`}
                  </strong>
                </div>

                {/* FLIGHT */}

                <PaymentFlightCard flight={flight} seat={seat} />

                {/* PRICE */}

                <div className="price-calculation">
                  <div className="price-row">
                    <span>Giá vé cơ bản</span>

                    <span>{formatMoney(basePrice)}</span>
                  </div>

                  {seatSurcharge > 0 && <div className="price-row">
                      <span>Phụ thu hạng ghế</span>

                      <span>{formatMoney(seatSurcharge)}</span>
                    </div>}

                  {baggagePrice > 0 && <div className="price-row">
                      <span>Hành lý {services.baggage_weight || 0}kg</span>

                      <span>{formatMoney(baggagePrice)}</span>
                    </div>}

                  {mealPrice > 0 && <div className="price-row">
                      <span>Suất ăn</span>

                      <span>{formatMoney(mealPrice)}</span>
                    </div>}

                  {insurancePrice > 0 && <div className="price-row">
                      <span>Bảo hiểm</span>

                      <span>{formatMoney(insurancePrice)}</span>
                    </div>}

                  <div className="price-row">
                    <span>Thuế, phí</span>

                    <span className="free-text">Đã bao gồm</span>
                  </div>

                  <div className="price-row">
                    <span>Phí thanh toán</span>

                    <span className="free-text">0đ</span>
                  </div>

                  <div className="price-row grand-total">
                    <span>Tổng thanh toán</span>

                    <strong>{formatMoney(totalPrice)}</strong>
                  </div>
                </div>

                {data.pending_momo && <p>Đơn đang có giao dịch MoMo. Bạn có thể mở lại liên kết MoMo hoặc <button type="button" onClick={() => navigate(`/payment-result?bookingId=${booking.id}`)}>kiểm tra trạng thái</button> trước khi thanh toán lại.</p>}
                {demoEnabled && !data.pending_momo && <button type="button" className="btn-mock-payment" disabled={paying || mockPaying} onClick={handleMockPayment}>
                  {mockPaying ? <>
                      <span className="mock-spinner" />
                      Đang xác nhận thanh toán...
                    </> : <>
                      <span>🎓</span>
                      Thanh toán Demo
                    </>}
                </button>}
                {demoEnabled && !data.pending_momo && <p>Bấm Demo để xác nhận đã thanh toán và nhận vé ngay trong hệ thống.</p>}

                {/* MOMO */}

                <button type="button" className="btn-submit-payment momo-button" disabled={paying || mockPaying} onClick={handleMomoPayment}>
                  {paying ? <>
                      <span className="payment-spinner" />
                      Đang kết nối MoMo...
                    </> : <>
                      Thanh toán bằng MoMo
                      <span>{formatMoney(totalPrice)}</span>
                    </>}
                </button>

                {/* BACK */}

                <button type="button" className="btn-cancel-payment" disabled={paying || mockPaying} onClick={() => navigate("/my-orders")}>
                  ← Về danh sách đơn đặt vé
                </button>

                <div className="security-guarantee">
                  <span>🔒</span>

                  <small>
                    Thông tin thanh toán được xử lý bởi backend và cổng MoMo.
                  </small>
                </div>
              </div>;
}
