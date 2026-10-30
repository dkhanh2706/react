import { formatMoney } from "../../utils/format.js";
import { normalizeSeatClass } from "../../utils/booking.js";
export default function BookingPriceSummary({
  selectedSeat,
  flight,
  getSeatSurcharge,
  baggagePrice,
  services,
  mealPrice,
  insurancePrice,
  totalPrice,
  creatingBooking,
  goPayment
}) {
  return <div className="summary-card seat-selection-summary">
                <h3>Chi tiết đặt chỗ</h3>

                {selectedSeat ? <div className="selected-seat-details">
                    {/* SELECTED SEAT */}

                    <div className="seat-chosen-banner">
                      <div className="seat-big-badge">
                        {selectedSeat.seat_number}
                      </div>

                      <div>
                        <strong>Ghế số {selectedSeat.seat_number}</strong>

                        <p>Hạng: {normalizeSeatClass(selectedSeat.class)}</p>
                      </div>
                    </div>

                    {/* PRICE */}

                    <div className="price-breakdown">
                      {/* BASE */}

                      <div className="breakdown-row">
                        <span>Giá vé cơ bản</span>

                        <span>{formatMoney(flight.price)}</span>
                      </div>

                      {/* BUSINESS */}

                      {getSeatSurcharge() > 0 && <div className="breakdown-row highlight">
                          <span>Phụ thu hạng {normalizeSeatClass(selectedSeat.class) === "FIRST" ? "Nhất" : "Thương gia"}</span>

                          <span>{formatMoney(getSeatSurcharge())}</span>
                        </div>}

                      {/* BAGGAGE */}

                      {baggagePrice > 0 && <div className="breakdown-row">
                          <span>Hành lý {services.baggage_weight || 0}kg</span>

                          <span>{formatMoney(baggagePrice)}</span>
                        </div>}

                      {/* MEAL */}

                      {mealPrice > 0 && <div className="breakdown-row">
                          <span>Suất ăn</span>

                          <span>{formatMoney(mealPrice)}</span>
                        </div>}

                      {/* INSURANCE */}

                      {insurancePrice > 0 && <div className="breakdown-row">
                          <span>Bảo hiểm</span>

                          <span>{formatMoney(insurancePrice)}</span>
                        </div>}

                      {/* TOTAL */}

                      <div className="breakdown-row total-row">
                        <span>Tổng tạm tính</span>

                        <strong className="final-price">
                          {formatMoney(totalPrice())}
                        </strong>
                      </div>
                    </div>

                    {/* HOLD NOTICE */}

                    <div className="hold-time-notice">
                      <span>⏳</span>
                      Ghế sẽ được giữ tạm thời trong 15 phút.
                    </div>
                  </div> : <div className="no-seat-selected">
                    <span className="seat-prompt-icon">💺</span>

                    <p>
                      Vui lòng nhấp chọn 1 ghế trên sơ đồ cabin để tiếp tục.
                    </p>
                  </div>}

                {/* =================================================
                    PAYMENT BUTTON
                 ================================================= */}

                <button type="button" className="btn-proceed-pay" disabled={creatingBooking || !selectedSeat} onClick={goPayment}>
                  {creatingBooking ? "Đang xử lý đặt chỗ..." : selectedSeat ? `Tiếp tục thanh toán (${formatMoney(totalPrice())}) →` : "Vui lòng chọn ghế"}
                </button>
              </div>;
}
