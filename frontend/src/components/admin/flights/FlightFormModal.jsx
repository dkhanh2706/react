import { formatNumber } from "../../../utils/format.js";
import { X } from "lucide-react";

export default function FlightFormModal({ editId, setIsModalOpen, handleSubmit, flights, form, handleChange, AIRLINES, catalog, AIRPORTS, submitting }) {
  return (
<div className="adm-modal-overlay">
            <div className="adm-modal-card">
              <div className="adm-modal-header">
                <div>
                  <h2>
                    {editId ? "Chỉnh sửa chuyến bay" : "Thêm chuyến bay mới"}
                  </h2>

                  <p>Nhập đầy đủ thông tin hành trình và cấu hình giá vé</p>
                </div>

                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="adm-modal-body">
                <div className="adm-form-grid">
                  {editId && flights.find(f => f.id === editId)?.has_history && <p className="flight-edit-notice">
                    Chuyến đã có lịch sử đặt chỗ. Mã chuyến, hãng, máy bay và hành trình được khóa; thay đổi giờ bay sẽ giữ nguyên thông tin vé lúc mua.
                  </p>}
                  {/* MÃ CHUYẾN */}
                  <div className="adm-form-group">
                    <label>
                      Mã chuyến bay <span>*</span>
                    </label>

                    <input
                      name="flight_number"
                      placeholder="VD: VN-210, VJ-152"
                      value={form.flight_number}
                      onChange={handleChange}
                      disabled={Boolean(editId && flights.find(f => f.id === editId)?.has_history)}
                      required
                    />
                  </div>

                  {/* HÃNG BAY */}
                  <div className="adm-form-group">
                    <label>Hãng hàng không</label>

                    <select
                      name="airline_id"
                      value={form.airline_id}
                      onChange={handleChange}
                      disabled={Boolean(editId && flights.find(f => f.id === editId)?.has_history)}
                    >
                      {AIRLINES.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="adm-form-group">
                    <label>Máy bay</label>
                    <select name="airplane_id" value={form.airplane_id} onChange={handleChange} required disabled={Boolean(editId && flights.find(f => f.id === editId)?.has_history)}>
                      <option value="">Chọn máy bay</option>
                      {catalog.airplanes.filter(p => p.airline_id === Number(form.airline_id)).map(p => <option key={p.id} value={p.id}>{p.model} — #{p.id} ({p.seat_capacity} ghế)</option>)}
                    </select>
                  </div>
                  {/* SÂN BAY ĐI */}
                  <div className="adm-form-group">
                    <label>Sân bay cất cánh</label>

                    <select
                      name="departure_airport_id"
                      value={form.departure_airport_id}
                      onChange={handleChange}
                      disabled={Boolean(editId && flights.find(f => f.id === editId)?.has_history)}
                    >
                      {AIRPORTS.map((ap) => (
                        <option key={ap.id} value={ap.id}>
                          {ap.code} - {ap.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SÂN BAY ĐẾN */}
                  <div className="adm-form-group">
                    <label>Sân bay hạ cánh</label>

                    <select
                      name="arrival_airport_id"
                      value={form.arrival_airport_id}
                      onChange={handleChange}
                      disabled={Boolean(editId && flights.find(f => f.id === editId)?.has_history)}
                    >
                      {AIRPORTS.map((ap) => (
                        <option key={ap.id} value={ap.id}>
                          {ap.code} - {ap.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* GIỜ KHỞI HÀNH */}
                  <div className="adm-form-group">
                    <label>
                      Giờ khởi hành (Departure) <span>*</span>
                    </label>

                    <input
                      type="datetime-local"
                      name="departure_time"
                      value={form.departure_time}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* GIỜ HẠ CÁNH */}
                  <div className="adm-form-group">
                    <label>
                      Giờ đến nơi (Arrival) <span>*</span>
                    </label>

                    <input
                      type="datetime-local"
                      name="arrival_time"
                      value={form.arrival_time}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* GIÁ */}
                  <div className="adm-form-group">
                    <label>
                      Giá vé cơ bản (VNĐ) -{" "}
                      <span className="price-preview-inline">
                        {formatNumber(form.price || 0)}đ
                      </span>
                    </label>

                    <input
                      type="number"
                      name="price"
                      min="100000"
                      step="50000"
                      value={form.price}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* TRẠNG THÁI */}
                  <div className="adm-form-group">
                    <label>Trạng thái chuyến bay</label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                    >
                      <option value="AVAILABLE">AVAILABLE (Đang mở bán)</option>

                      <option value="DELAYED">DELAYED (Chuyến bay hoãn)</option>

                    </select>
                  </div>
                </div>

                <div className="adm-modal-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    className="btn-adm-primary"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Đang lưu..."
                      : editId
                        ? "Lưu thay đổi"
                        : "Tạo chuyến bay"}
                  </button>
                </div>
              </form>
            </div>
          </div>
  );
}
