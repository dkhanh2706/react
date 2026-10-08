import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../api/axios";

import Header from "../components/Header";

import "../styles/MyTickets.css";

function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);

  const [expandedTicket, setExpandedTicket] = useState(null);

  // ==========================================
  // LOAD VÉ
  // ==========================================

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const response = await api.get("/bookings/my-tickets");

        setTickets(response.data?.data || []);
      } catch (error) {
        console.error("LOAD TICKETS ERROR:", error.response?.data || error);

        toast.error(
          error.response?.data?.message || "Không thể tải danh sách vé",
        );
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, []);

  // ==========================================
  // FORMAT TIỀN
  // ==========================================

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("vi-VN");
  };

  // ==========================================
  // FORMAT NGÀY
  // ==========================================

  const formatDate = (value) => {
    if (!value) {
      return "Chưa cập nhật";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("vi-VN");
  };

  // ==========================================
  // DỊCH HẠNG VÉ
  // ==========================================

  const className = (seatClass) => {
    switch (seatClass) {
      case "BUSINESS":
        return "Thương gia";

      case "FIRST":
        return "Hạng nhất";

      default:
        return "Phổ thông";
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <>
        <Header />

        <div className="tickets-loading">Đang tải vé máy bay...</div>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="tickets-page">
        <div className="tickets-heading">
          <div>
            <p className="tickets-subtitle">CHUYẾN ĐI CỦA BẠN</p>

            <h1>Vé máy bay của tôi</h1>

            <p>Xem thông tin chuyến bay, hạng vé, giá vé và dịch vụ đi kèm.</p>
          </div>

          <button
            type="button"
            className="tickets-search-button"
            onClick={() => navigate("/home")}
          >
            + Đặt chuyến bay mới
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="tickets-empty">
            <div className="tickets-empty-icon">✈</div>

            <h2>Bạn chưa có vé máy bay</h2>

            <p>Vé đã thanh toán sẽ xuất hiện tại đây.</p>

            <button type="button" onClick={() => navigate("/home")}>
              Tìm chuyến bay
            </button>
          </div>
        ) : (
          <div className="tickets-list">
            {tickets.map((ticket) => {
              const expanded = expandedTicket === ticket.id;

              return (
                <article className="ticket-card" key={ticket.id}>
                  <div className="ticket-top">
                    <div className="ticket-airline">
                      <div className="airline-icon">✈</div>

                      <div>
                        <strong>
                          {ticket.airline_name || "Airline Booking"}
                        </strong>

                        <span>
                          {ticket.flight_number_snapshot || "Chuyến bay"}
                        </span>
                      </div>
                    </div>

                    <div className="ticket-status">Đã thanh toán</div>
                  </div>

                  <div className="ticket-route">
                    <div className="route-point">
                      <strong>{ticket.departure_time_text || "--:--"}</strong>

                      <span>{ticket.departure_place || "Điểm đi"}</span>
                    </div>

                    <div className="route-line">
                      <span>Bay thẳng</span>

                      <div>
                        <i />
                        <b>✈</b>
                        <i />
                      </div>
                    </div>

                    <div className="route-point route-end">
                      <strong>{ticket.arrival_time_text || "--:--"}</strong>

                      <span>{ticket.arrival_place || "Điểm đến"}</span>
                    </div>
                  </div>

                  <div className="ticket-summary">
                    <div>
                      <span>Ngày bay</span>

                      <strong>{formatDate(ticket.flight_date)}</strong>
                    </div>

                    <div>
                      <span>Ghế</span>

                      <strong>{ticket.seat_number_snapshot || "---"}</strong>
                    </div>

                    <div>
                      <span>Hạng vé</span>

                      <strong>{className(ticket.seat_class)}</strong>
                    </div>

                    <div>
                      <span>Tổng tiền</span>

                      <strong className="ticket-price">
                        {formatMoney(ticket.total_price)}đ
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="ticket-detail-toggle"
                    onClick={() =>
                      setExpandedTicket(expanded ? null : ticket.id)
                    }
                  >
                    {expanded ? "Thu gọn" : "Xem chi tiết vé"}

                    <span>{expanded ? "⌃" : "⌄"}</span>
                  </button>

                  {expanded && (
                    <div className="ticket-details">
                      <section>
                        <h3>Chi tiết hành trình</h3>

                        <div className="detail-row">
                          <span>Mã đặt chỗ</span>

                          <strong>{ticket.booking_code}</strong>
                        </div>

                        <div className="detail-row">
                          <span>Hãng bay</span>

                          <strong>{ticket.airline_name || "---"}</strong>
                        </div>

                        <div className="detail-row">
                          <span>Số hiệu chuyến bay</span>

                          <strong>
                            {ticket.flight_number_snapshot || "---"}
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>Hành trình</span>

                          <strong>
                            {ticket.departure_place}
                            {" → "}
                            {ticket.arrival_place}
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>Ngày bay</span>

                          <strong>{formatDate(ticket.flight_date)}</strong>
                        </div>

                        <div className="detail-row">
                          <span>Thời gian</span>

                          <strong>
                            {ticket.departure_time_text}
                            {" → "}
                            {ticket.arrival_time_text}
                          </strong>
                        </div>
                      </section>

                      <section>
                        <h3>Hạng vé & giá vé</h3>

                        <div className="detail-row">
                          <span>Hạng vé</span>

                          <strong>{className(ticket.seat_class)}</strong>
                        </div>

                        <div className="detail-row">
                          <span>Số ghế</span>

                          <strong>{ticket.seat_number_snapshot}</strong>
                        </div>

                        <div className="detail-row">
                          <span>Giá vé</span>

                          <strong>{formatMoney(ticket.price)}đ</strong>
                        </div>

                        <div className="detail-row total">
                          <span>Tổng thanh toán</span>

                          <strong>{formatMoney(ticket.total_price)}đ</strong>
                        </div>
                      </section>

                      <section>
                        <h3>Dịch vụ đi kèm</h3>

                        <div className="service-item">
                          <span>✓</span>

                          <div>
                            <strong>Hành lý xách tay</strong>

                            <p>Theo chính sách hạng vé</p>
                          </div>
                        </div>

                        <div className="service-item">
                          <span>✓</span>

                          <div>
                            <strong>Chọn chỗ ngồi</strong>

                            <p>Ghế {ticket.seat_number_snapshot}</p>
                          </div>
                        </div>

                        {ticket.seat_class === "BUSINESS" && (
                          <div className="service-item">
                            <span>✓</span>

                            <div>
                              <strong>Quyền lợi hạng Thương gia</strong>

                              <p>Áp dụng theo chính sách hạng vé</p>
                            </div>
                          </div>
                        )}
                      </section>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

export default MyTickets;
