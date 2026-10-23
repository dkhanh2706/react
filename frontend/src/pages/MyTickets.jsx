import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TicketReview from "../components/TicketReview";
import { airportName } from "../utils/airportNames";

import "../styles/MyTickets.css";

function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsReady, setReviewsReady] = useState(false);

  const updateReview = (item) => {
    setReviews(current => [...current.filter(existing => existing.booking_id !== item.booking_id), item]);
    api.get("/reviews/mine").then(({ data }) => setReviews(data.data)).catch(() => {});
  };

  useEffect(() => {
    let active = true;
    api.get("/reviews/mine").then(({ data }) => {
      if (active) { setReviews(data.data); setReviewsReady(true); }
    }).catch(() => { /* Tickets stay available if reviews have not been migrated. */ });
    return () => { active = false; };
  }, []);

  // LOAD VÉ
  useEffect(() => {
    const loadTickets = async () => {
      try {
        const response = await api.get("/bookings/my-tickets");
        setTickets(response.data?.data || []);
      } catch (error) {
        console.error("LOAD TICKETS ERROR:", error.response?.data || error);
        toast.error(
          error.response?.data?.message || "Không thể tải danh sách vé"
        );
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, []);

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("vi-VN");
  };

  const formatDate = (value) => {
    if (!value) return "Chưa cập nhật";
    const str = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split("-");
      return `${d}/${m}/${y}`;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return str;
    return date.toLocaleDateString("vi-VN");
  };

  const className = (seatClass) => {
    switch (seatClass) {
      case "BUSINESS":
        return "Thương gia (Business)";
      case "FIRST":
        return "Hạng nhất (First)";
      default:
        return "Phổ thông (Economy)";
    }
  };

  return (
    <div className="my-tickets-wrapper">
      <Header />

      <main className="tickets-page">
        <div className="tickets-container">
          <div className="tickets-heading">
            <div>
              <span className="tickets-tag">HÀNH TRÌNH ĐÃ ĐẶT</span>
              <h1>Vé máy bay của tôi</h1>
              <p>Quản lý toàn bộ vé máy bay điện tử, chi tiết chỗ ngồi và dịch vụ đã đặt</p>
            </div>

            <button
              type="button"
              className="tickets-search-button"
              onClick={() => navigate("/destinations")}
            >
              + Đặt chuyến bay mới
            </button>
          </div>

          {loading ? (
            <div className="tickets-loading-box">
              <span className="tickets-loading-icon">✈</span>
              <p>Đang tải danh sách vé máy bay của bạn...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="tickets-empty">
              <div className="tickets-empty-icon">🎫</div>
              <h2>Bạn chưa có chuyến bay nào</h2>
              <p>Các vé máy bay bạn đã thanh toán thành công sẽ hiển thị đầy đủ tại đây.</p>
              <button
                type="button"
                className="btn-find-flights"
                onClick={() => navigate("/destinations")}
              >
                Khám phá chuyến bay ngay
              </button>
            </div>
          ) : (
            <div className="tickets-list">
              {tickets.map((ticket) => {
                const expanded = expandedTicket === ticket.id;

                return (
                  <article className="ticket-card-modern" key={ticket.id}>
                    {/* TICKET TOP / AIRLINE BAR */}
                    <div className="ticket-header-bar">
                      <div className="ticket-airline-info">
                        <span className="airline-emblem">✈</span>
                        <div>
                          <strong>{ticket.airline_name || "DAMH Shop"}</strong>
                          <span className="flight-pnr">
                            Mã chuyến: {ticket.flight_number_snapshot || "---"}
                          </span>
                        </div>
                      </div>

                      <div className="ticket-status-pill">
                        <span className="status-dot" /> {ticket.status === "PAYMENT_REVIEW" ? "Cần đối soát / hoàn tiền" : ticket.payment_status === "REFUNDED" ? "Đã hoàn tiền" : ticket.current_flight_status === "CANCELLED" ? "Chuyến đã hủy" : "Đã thanh toán"}
                      </div>
                    </div>

                    <div className="ticket-current-schedule">
                      <span>Trạng thái chuyến hiện tại: <strong>{ticket.current_flight_status}</strong></span>
                      <span>Lịch hiện tại: {airportName(ticket.current_departure_code)} → {airportName(ticket.current_arrival_code)}, {formatDate(ticket.current_flight_date)}, {ticket.current_departure_clock} – {ticket.current_arrival_clock}</span>
                    </div>
                    <p className="ticket-snapshot-label">VÉ ĐIỆN TỬ · THÔNG TIN LÚC ĐẶT</p>
                    {/* TICKET ROUTE & SCHEDULE */}
                    <div className="ticket-flight-content">
                      <div className="ticket-route-display">
                        <div className="airport-col">
                          <span className="flight-hour">
                            {ticket.departure_time_text || "--:--"}
                          </span>
                          <strong className="airport-name">
                            {airportName(ticket.departure_place, "Điểm đi")}
                          </strong>
                          <small>Khởi hành</small>
                        </div>

                        <div className="route-flight-path">
                          <span className="flight-badge-direct">Bay thẳng</span>
                          <div className="flight-path-bar">
                            <span className="p-dot" />
                            <span className="p-line" />
                            <span className="p-icon">✈</span>
                            <span className="p-line" />
                            <span className="p-dot" />
                          </div>
                          <span className="flight-date-tag">
                            {formatDate(ticket.flight_date)}
                          </span>
                        </div>

                        <div className="airport-col text-right">
                          <span className="flight-hour">
                            {ticket.arrival_time_text || "--:--"}
                          </span>
                          <strong className="airport-name">
                            {airportName(ticket.arrival_place, "Điểm đến")}
                          </strong>
                          <small>Hạ cánh</small>
                        </div>
                      </div>

                      {/* QUICK HIGHLIGHTS */}
                      <div className="ticket-quick-meta">
                        <div className="meta-pill">
                          <small>Mã đặt chỗ (PNR)</small>
                          <strong className="pnr-code">
                            {ticket.booking_code || "---"}
                          </strong>
                        </div>

                        <div className="meta-pill">
                          <small>Ghế ngồi</small>
                          <strong>{ticket.seat_number_snapshot || "Chưa gán"}</strong>
                        </div>

                        <div className="meta-pill">
                          <small>Hạng vé</small>
                          <strong>{className(ticket.seat_class)}</strong>
                        </div>

                        <div className="meta-pill total-fare">
                          <small>Tổng giá vé</small>
                          <strong>{formatMoney(ticket.total_price)}đ</strong>
                        </div>
                      </div>
                    </div>

                    {/* TOGGLE EXPAND */}
                    <div className="ticket-card-footer">
                      <button
                        type="button"
                        className="btn-toggle-details"
                        onClick={() =>
                          setExpandedTicket(expanded ? null : ticket.id)
                        }
                      >
                        {expanded ? "Thu gọn thông tin" : "Xem chi tiết vé điện tử"}
                        <span className="toggle-chevron">
                          {expanded ? "▲" : "▼"}
                        </span>
                      </button>
                    </div>

                    {/* EXPANDED DETAILS */}
                    <TicketReview ticket={ticket} review={reviews.find(item => item.booking_id === ticket.id)} ready={reviewsReady} onChange={updateReview} />
                    {expanded && (
                      <div className="ticket-expanded-section">
                        <div className="expanded-grid">
                          {/* CỘT 1: HÀNH TRÌNH */}
                          <div className="expanded-col">
                            <h4>Chi tiết hành trình</h4>
                            <div className="row-item">
                              <span>Mã đặt chỗ:</span>
                              <strong>{ticket.booking_code}</strong>
                            </div>
                            <div className="row-item">
                              <span>Hãng vận chuyển:</span>
                              <strong>{ticket.airline_name || "---"}</strong>
                            </div>
                            <div className="row-item">
                              <span>Số hiệu chuyến bay:</span>
                              <strong>{ticket.flight_number_snapshot || "---"}</strong>
                            </div>
                            <div className="row-item">
                              <span>Tuyến bay:</span>
                              <strong>
                                {airportName(ticket.departure_place)} → {airportName(ticket.arrival_place)}
                              </strong>
                            </div>
                            <div className="row-item">
                              <span>Ngày bay:</span>
                              <strong>{formatDate(ticket.flight_date)}</strong>
                            </div>
                          </div>

                          {/* CỘT 2: CHI PHÍ & GHẾ */}
                          <div className="expanded-col">
                            <h4>Hạng vé & Chi phí</h4>
                            <div className="row-item">
                              <span>Hạng ghế:</span>
                              <strong>{className(ticket.seat_class)}</strong>
                            </div>
                            <div className="row-item">
                              <span>Vị trí ghế:</span>
                              <strong>{ticket.seat_number_snapshot}</strong>
                            </div>
                            <div className="row-item">
                              <span>Giá vé gốc:</span>
                              <span>{formatMoney(ticket.price)}đ</span>
                            </div>
                            <div className="row-item total-highlight">
                              <span>Tổng thanh toán:</span>
                              <strong>{formatMoney(ticket.total_price)}đ</strong>
                            </div>
                          </div>

                          {/* CỘT 3: TIỆN ÍCH */}
                          <div className="expanded-col">
                            <h4>Quyền lợi & Tiện ích</h4>
                            <div className="benefit-item">
                              <span className="check-mark">✓</span>
                              <div>
                                <strong>Hành lý xách tay 07kg</strong>
                                <small>Theo tiêu chuẩn an toàn hàng không</small>
                              </div>
                            </div>
                            <div className="benefit-item">
                              <span className="check-mark">✓</span>
                              <div>
                                <strong>Đã chọn trước chỗ ngồi</strong>
                                <small>Ghế {ticket.seat_number_snapshot}</small>
                              </div>
                            </div>
                            {ticket.seat_class === "BUSINESS" && (
                              <div className="benefit-item">
                                <span className="check-mark">★</span>
                                <div>
                                  <strong>Quyền lợi Hạng Thương gia</strong>
                                  <small>Phòng chờ thương gia & Lối đi ưu tiên</small>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default MyTickets;
