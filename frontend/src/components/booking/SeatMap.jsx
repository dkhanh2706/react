import { normalizeSeatClass, normalizeSeatStatus } from "../../utils/booking.js";
export default function SeatMap({
  loadingSeats,
  seats,
  firstSeats,
  businessSeats,
  economySeats,
  selectedSeat,
  holdingSeat,
  creatingBooking,
  chooseSeat
}) {
  const renderSeat = seat => {
    const seatStatus = normalizeSeatStatus(seat.status);
    const seatClassValue = normalizeSeatClass(seat.class);
    const isBooked = seatStatus === "BOOKED";
    const isHold = seatStatus === "HOLD";
    const isSelected = selectedSeat?.id === seat.id;
    let seatClass = "seat economy";
    if (isSelected) {
      seatClass = "seat selected";
    } else if (isBooked) {
      seatClass = "seat booked";
    } else if (isHold) {
      seatClass = "seat held";
    } else if (seatClassValue === "BUSINESS" || seatClassValue === "FIRST") {
      seatClass = "seat business";
    }
    return <button key={seat.id} type="button" disabled={holdingSeat || creatingBooking || (isBooked || isHold && !seat.held_by_me) && !isSelected} className={seatClass} onClick={() => {
      if (!isSelected && !isBooked && (!isHold || seat.held_by_me)) {
        chooseSeat(seat);
      }
    }} title={`Ghế ${seat.seat_number} - ${seatClassValue}`}>
        <span className="seat-num">{seat.seat_number}</span>

        <span className="seat-status-label">
          {isSelected ? "Đang chọn" : isBooked ? "Đã đặt" : isHold ? "Giữ" : seatClassValue === "BUSINESS" ? "VIP" : seatClassValue === "FIRST" ? "First" : "Eco"}
        </span>
      </button>;
  };
  return <div className="cabin-map-section">
              <div className="cabin-map-card">
                {/* HEADER */}

                <div className="cabin-header">
                  <h2>Sơ đồ khoang hành khách</h2>

                  <div className="seat-legend">
                    <span className="legend-item">
                      <span className="legend-dot available-eco" />
                      Phổ thông
                    </span>

                    <span className="legend-item">
                      <span className="legend-dot available-biz" />
                      Thương gia
                    </span>

                    <span className="legend-item">
                      <span className="legend-dot selected-dot" />
                      Đang chọn
                    </span>

                    <span className="legend-item">
                      <span className="legend-dot booked-dot" />
                      Đã đặt/Giữ
                    </span>
                  </div>
                </div>

                {/* NOSE */}

                <div className="airplane-nose">
                  <div className="cockpit-icon">👨‍✈️ Buồng lái / Khoang mũi</div>
                </div>

                {/* SEATS */}

                {loadingSeats ? <div className="cabin-loading">
                    <div className="spinner-plane">✈</div>

                    <p>Đang tải sơ đồ ghế ngồi trên chuyến bay...</p>
                  </div> : seats.length === 0 ? <div className="cabin-empty">
                    <p>Chuyến bay này hiện chưa có dữ liệu sơ đồ ghế.</p>
                  </div> : <div className="cabin-seats-wrapper">
                    {/* FIRST */}

                    {firstSeats.length > 0 && <div className="cabin-zone">
                        <div className="zone-tag first-tag">
                          <span>FIRST CLASS</span>
                        </div>

                        <div className="seats-grid first-grid">
                          {firstSeats.map(renderSeat)}
                        </div>
                      </div>}

                    {/* BUSINESS */}

                    {businessSeats.length > 0 && <div className="cabin-zone">
                        <div className="zone-tag biz-tag">
                          <span>BUSINESS CLASS (HẠNG THƯƠNG GIA)</span>
                        </div>

                        <div className="seats-grid biz-grid">
                          {businessSeats.map(renderSeat)}
                        </div>
                      </div>}

                    {/* DIVIDER */}

                    {(firstSeats.length > 0 || businessSeats.length > 0) && economySeats.length > 0 && <div className="cabin-divider">
                          <span>✦ LỐI ĐI VÀ CỬA THOÁT HIỂM ✦</span>
                        </div>}

                    {/* ECONOMY */}

                    {economySeats.length > 0 && <div className="cabin-zone">
                        <div className="zone-tag eco-tag">
                          <span>ECONOMY CLASS (HẠNG PHỔ THÔNG)</span>
                        </div>

                        <div className="seats-grid eco-grid">
                          {economySeats.map(renderSeat)}
                        </div>
                      </div>}
                  </div>}

                {/* TAIL */}

                <div className="airplane-tail">
                  <span>Khoang sau / Đuôi máy bay</span>
                </div>
              </div>
            </div>;
}
