import { formatNumber } from "../../../utils/format.js";
import { Edit2, Trash2, ArrowRight } from "lucide-react";

export default function FlightTable({ visibleFlights, openEditModal, setDeleteTarget, setCancelReason, filteredFlights, visiblePage, setTablePage, tablePages }) {
  return (
<div className="adm-table-responsive">
              <table className="adm-modern-table">
                <thead>
                  <tr>
                    <th>Mã chuyến</th>
                    <th>Hãng hàng không</th>
                    <th>Hành trình (Đi ➔ Đến)</th>
                    <th>Giờ khởi hành</th>
                    <th>Giờ hạ cánh</th>
                    <th>Giá vé (VNĐ)</th>
                    <th>Ghế (đặt/giữ/trống)</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleFlights.map((flight) => (
                    <tr key={flight.id}>
                      <td>
                        <span className="flight-code-badge">
                          {flight.flight_number || `FL-${flight.id}`}
                        </span>
                        {flight.demo_key && <span className="demo-flight-label">Demo</span>}
                      </td>

                      <td>
                        <strong className="airline-text">
                          {flight.airline || `Hãng #${flight.airline_id}`}
                        </strong>
                      </td>

                      <td>
                        <div className="route-flow">
                          <span className="airport-pill">
                            {flight.departure_code ||
                              `Sân bay #${flight.departure_airport_id}`}
                          </span>

                          <ArrowRight size={13} className="arrow-flow" />

                          <span className="airport-pill">
                            {flight.arrival_code ||
                              `Sân bay #${flight.arrival_airport_id}`}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="time-badge">
                          {flight.departure_time
                            ? flight.departure_time
                                .substring(0, 16)
                                .replace("T", " ")
                            : "--:--"}
                        </span>
                      </td>

                      <td>
                        <span className="time-badge">
                          {flight.arrival_time
                            ? flight.arrival_time
                                .substring(0, 16)
                                .replace("T", " ")
                            : "--:--"}
                        </span>
                      </td>

                      <td>
                        <strong className="price-tag-modern">
                          {formatNumber(flight.price || 0)}đ
                        </strong>
                      </td>

                      <td>
                        <strong>{Number(flight.booked_seats || 0)}</strong> / {Number(flight.held_seats || 0)} / {Math.max(0, Number(flight.total_seats || 0) - Number(flight.booked_seats || 0) - Number(flight.held_seats || 0))}
                      </td>

                      <td>
                        <span
                          className={`status-pill ${flight.status === "AVAILABLE" && !flight.is_sellable
                            ? "cancelled"
                            : String(flight.status || "AVAILABLE").toLowerCase()}`}
                        >
                          {flight.status === "AVAILABLE"
                            ? (flight.is_sellable ? "ĐANG MỞ BÁN" : "KHÔNG CÒN BÁN")
                            : flight.status}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="btn-action edit"
                            onClick={() => openEditModal(flight)}
                            title="Chỉnh sửa chuyến bay"
                            disabled={flight.status === "CANCELLED"}
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            type="button"
                            className="btn-action delete"
                            onClick={() => { setDeleteTarget(flight); setCancelReason(""); }}
                            title={flight.has_history || flight.demo_key ? "Hủy chuyến bay" : "Xóa chuyến chưa sử dụng"}
                            disabled={flight.status === "CANCELLED"}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredFlights.length > 25 && <div className="demo-flight-pagination">
                <button type="button" className="btn-refresh" disabled={visiblePage <= 1} onClick={() => setTablePage(visiblePage - 1)}>Trang trước</button>
                <span>Trang {visiblePage}/{tablePages} · {formatNumber(filteredFlights.length)} chuyến</span>
                <button type="button" className="btn-refresh" disabled={visiblePage >= tablePages} onClick={() => setTablePage(visiblePage + 1)}>Trang sau</button>
              </div>}
            </div>
  );
}
