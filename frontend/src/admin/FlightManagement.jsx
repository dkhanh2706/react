import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";

import {
  Plane,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  DollarSign,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import DemoFlightSchedule from "./DemoFlightSchedule";
import "../styles/admin/FlightManagement.css";

function FlightManagement() {
  const [catalog, setCatalog] = useState({ airports: [], airlines: [], airplanes: [] });
  const AIRPORTS = catalog.airports;
  const AIRLINES = catalog.airlines;
  useEffect(() => {
    let active = true;
    api.get("/flights/catalog").then(r => { if (active) setCatalog(r.data); })
      .catch(() => toast.error("Không tải được danh mục sân bay, hãng và máy bay"));
    return () => { active = false; };
  }, []);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [tablePage, setTablePage] = useState(1);

  // Modal form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [form, setForm] = useState({
    flight_number: "",
    airline_id: 1,
    airplane_id: 1,
    departure_airport_id: 1,
    arrival_airport_id: 2,
    departure_time: "",
    arrival_time: "",
    price: 1500000,
    status: "AVAILABLE",
  });

  // =====================================================
  // GET FLIGHTS - DÙNG CHO NÚT LÀM MỚI
  // =====================================================
  const loadFlights = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await api.get("/flights", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data?.data || response.data || [];

      setFlights(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải chuyến bay:", error);

      toast.error(
        error.response?.data?.message || "Không tải được danh sách chuyến bay",
      );

      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD LẦN ĐẦU KHI MỞ TRANG
  // =====================================================
  useEffect(() => {
    let cancelled = false;

    const token = localStorage.getItem("token");

    api
      .get("/flights", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (cancelled) return;

        const data = response.data?.data || response.data || [];

        setFlights(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (cancelled) return;

        console.error("Lỗi tải chuyến bay:", error);

        toast.error(
          error.response?.data?.message ||
            "Không tải được danh sách chuyến bay",
        );

        setFlights([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // =====================================================
  // CHANGE INPUT
  // =====================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      ...(name === "airline_id" ? { airplane_id: catalog.airplanes.find(p => p.airline_id === Number(value))?.id || "" } : {}),
      [name]:
        name === "price" || name.endsWith("_id")
          ? Number(value) || value
          : value,
    }));
  };

  // =====================================================
  // OPEN CREATE MODAL
  // =====================================================
  const openCreateModal = () => {
    setEditId(null);

    setForm({
      flight_number: "",
      airline_id: AIRLINES[0]?.id || "",
      airplane_id: catalog.airplanes.find(p => p.airline_id === AIRLINES[0]?.id)?.id || "",
      departure_airport_id: AIRPORTS[0]?.id || "",
      arrival_airport_id: AIRPORTS[1]?.id || "",
      departure_time: "",
      arrival_time: "",
      price: 1500000,
      status: "AVAILABLE",
    });

    setIsModalOpen(true);
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================
  const openEditModal = (flight) => {
    setEditId(flight.id);

    setForm({
      flight_number: flight.flight_number || "",
      airline_id: flight.airline_id || 1,
      airplane_id: flight.airplane_id || 1,
      departure_airport_id: flight.departure_airport_id || 1,
      arrival_airport_id: flight.arrival_airport_id || 2,
      departure_time: flight.departure_time
        ? flight.departure_time.substring(0, 16)
        : "",
      arrival_time: flight.arrival_time
        ? flight.arrival_time.substring(0, 16)
        : "",
      price: flight.price || 1500000,
      status: flight.status || "AVAILABLE",
    });

    setIsModalOpen(true);
  };

  // =====================================================
  // SUBMIT CREATE / UPDATE
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.flight_number.trim()) {
      toast.error("Vui lòng nhập mã chuyến bay (VD: VN-210)");
      return;
    }

    if (!form.departure_time || !form.arrival_time) {
      toast.error("Vui lòng chọn thời gian khởi hành và đến");
      return;
    }

    if (form.departure_airport_id === form.arrival_airport_id) {
      toast.error("Sân bay đi và sân bay đến không được trùng nhau");
      return;
    }

    const departure = new Date(form.departure_time);
    const arrival = new Date(form.arrival_time);

    if (arrival <= departure) {
      toast.error("Thời gian đến phải sau thời gian khởi hành");
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (editId) {
        await api.put(`/flights/${editId}`, form, config);

        toast.success(`Cập nhật chuyến bay ${form.flight_number} thành công!`);
      } else {
        await api.post("/flights", form, config);

        toast.success(`Thêm mới chuyến bay ${form.flight_number} thành công!`);
      }

      setIsModalOpen(false);

      await loadFlights();
    } catch (error) {
      console.error("SAVE FLIGHT ERROR:", error);

      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi lưu chuyến bay",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      const token = localStorage.getItem("token");

      const mustCancel = deleteTarget.has_history || deleteTarget.demo_key;
      const response = mustCancel
        ? await api.patch(`/flights/${deleteTarget.id}/cancel`, { reason: cancelReason }, { headers: { Authorization: `Bearer ${token}` } })
        : await api.delete(`/flights/${deleteTarget.id}`, { headers: { Authorization: `Bearer ${token}` } });

      toast.success(response.data.message);

      setDeleteTarget(null);
      setCancelReason("");

      await loadFlights();
    } catch (error) {
      console.error("DELETE FLIGHT ERROR:", error);

      toast.error(error.response?.data?.message || "Xóa chuyến bay thất bại");
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // FILTERED FLIGHTS
  // =====================================================
  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      const query = searchQuery.trim().toLowerCase();

      const matchSearch =
        !query ||
        (flight.flight_number || "").toLowerCase().includes(query) ||
        (flight.airline || "").toLowerCase().includes(query) ||
        (flight.departure_code || "").toLowerCase().includes(query) ||
        (flight.arrival_code || "").toLowerCase().includes(query);

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "SELLABLE" ? flight.is_sellable : String(flight.status || "").toUpperCase() === statusFilter);

      const matchDate = !dateFilter || String(flight.departure_time || "").slice(0, 10) === dateFilter;

      return matchSearch && matchStatus && matchDate;
    });
  }, [flights, searchQuery, statusFilter, dateFilter]);
  const tablePages = Math.max(1, Math.ceil(filteredFlights.length / 25));
  const visiblePage = Math.min(tablePage, tablePages);
  const visibleFlights = filteredFlights.slice((visiblePage - 1) * 25, visiblePage * 25);

  // =====================================================
  // STATS
  // =====================================================
  const totalFlights = flights.length;

  const availableFlights = flights.filter((f) => f.is_sellable).length;

  const delayedFlights = flights.filter(
    (f) => String(f.status).toUpperCase() === "DELAYED",
  ).length;

  const avgPrice =
    totalFlights > 0
      ? Math.round(
          flights.reduce((acc, f) => acc + Number(f.price || 0), 0) /
            totalFlights,
        )
      : 0;

  return (
    <AdminLayout pageTitle="Quản lý chuyến bay">
      <div className="adm-flights-page">
        {/* ================= TOP HEADER ================= */}
        <div className="adm-page-header-row">
          <div>
            <span className="adm-page-tag">FLIGHT OPERATIONS</span>

            <h1>Lịch trình & Chuyến bay</h1>

            <p>
              Quản lý toàn bộ danh sách chuyến bay, thiết lập giờ khởi hành và
              giá vé
            </p>
          </div>

          <div className="adm-header-actions">
            <button
              type="button"
              className="btn-refresh"
              onClick={loadFlights}
              disabled={loading}
              title="Tải lại dữ liệu"
            >
              <RefreshCw size={16} className={loading ? "spin" : ""} />

              <span>{loading ? "Đang tải..." : "Làm mới"}</span>
            </button>

            <button
              type="button"
              className="btn-adm-primary"
              onClick={openCreateModal}
            >
              <Plus size={18} />

              <span>Thêm chuyến bay mới</span>
            </button>
          </div>
        </div>

        <DemoFlightSchedule />

        {/* ================= STATS CARDS ================= */}
        <div className="adm-flight-stats-row">
          <div className="f-stat-card">
            <div className="f-stat-icon blue">
              <Plane size={22} />
            </div>

            <div>
              <span className="f-stat-label">Tổng chuyến bay</span>

              <strong className="f-stat-val">{totalFlights}</strong>
            </div>
          </div>

          <div className="f-stat-card">
            <div className="f-stat-icon green">✓</div>

            <div>
              <span className="f-stat-label">Đang mở bán</span>

              <strong className="f-stat-val">{availableFlights}</strong>
            </div>
          </div>

          <div className="f-stat-card">
            <div className="f-stat-icon yellow">⏳</div>

            <div>
              <span className="f-stat-label">Chuyến bị hoãn</span>

              <strong className="f-stat-val">{delayedFlights}</strong>
            </div>
          </div>

          <div className="f-stat-card">
            <div className="f-stat-icon purple">
              <DollarSign size={22} />
            </div>

            <div>
              <span className="f-stat-label">Giá vé trung bình</span>

              <strong className="f-stat-val">
                {avgPrice.toLocaleString("vi-VN")}đ
              </strong>
            </div>
          </div>
        </div>

        {/* ================= TABLE CARD ================= */}
        <div className="adm-content-card">
          {/* SEARCH & FILTER BAR */}
          <div className="adm-table-toolbar">
            <div className="adm-search-input-box">
              <Search size={18} className="search-icon" />

              <input
                type="text"
                placeholder="Tìm mã chuyến bay, hãng bay, sân bay..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setTablePage(1); }}
              />

              {searchQuery && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="adm-filter-group">
              <Filter size={16} className="filter-icon" />

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setTablePage(1); }}
              >
                <option value="ALL">Tất cả trạng thái</option>

                <option value="SELLABLE">Đang thực sự mở bán</option>

                <option value="AVAILABLE">Đang mở bán (Available)</option>

                <option value="DELAYED">Chuyến bay hoãn (Delayed)</option>

                <option value="CANCELLED">Đã hủy (Cancelled)</option>
              </select>
              <input type="date" aria-label="Lọc theo ngày bay" value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setTablePage(1); }} />
            </div>
          </div>

          {/* ================= TABLE ================= */}
          {loading ? (
            <div className="adm-table-empty-state">
              <div className="loading-spinner-circle" />

              <p>Đang tải danh sách chuyến bay...</p>
            </div>
          ) : filteredFlights.length === 0 ? (
            <div className="adm-table-empty-state">
              <span className="empty-glyph">✈</span>

              <h3>Không tìm thấy chuyến bay nào</h3>

              <p>Thử tìm kiếm với từ khóa khác hoặc tạo chuyến bay mới.</p>

              <button
                type="button"
                className="btn-adm-primary"
                onClick={openCreateModal}
              >
                + Thêm chuyến bay
              </button>
            </div>
          ) : (
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
                          {Number(flight.price || 0).toLocaleString("vi-VN")}đ
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
                <span>Trang {visiblePage}/{tablePages} · {filteredFlights.length.toLocaleString("vi-VN")} chuyến</span>
                <button type="button" className="btn-refresh" disabled={visiblePage >= tablePages} onClick={() => setTablePage(visiblePage + 1)}>Trang sau</button>
              </div>}
            </div>
          )}
        </div>

        {/* ================= MODAL TẠO / SỬA ================= */}
        {isModalOpen && (
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
                        {Number(form.price || 0).toLocaleString("vi-VN")}đ
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
        )}

        {/* ================= MODAL XÓA ================= */}
        {deleteTarget && (
          <div className="adm-modal-overlay">
            <div className="adm-modal-card confirm-modal">
              <div className="confirm-icon-box">
                <AlertTriangle size={36} />
              </div>

              <h3>{deleteTarget.has_history || deleteTarget.demo_key ? "Xác nhận hủy chuyến bay?" : "Xác nhận xóa chuyến bay?"}</h3>

              <p>
                Bạn có chắc chắn muốn {deleteTarget.has_history || deleteTarget.demo_key ? "hủy" : "xóa"} chuyến bay{" "}
                <strong>{deleteTarget.flight_number}</strong> khỏi hệ thống?
                {deleteTarget.has_history || deleteTarget.demo_key
                  ? " Chuyến được giữ lại trong lịch sử; đặt chỗ bị hủy và khoản đã thu được chuyển đối soát."
                  : " Chuyến chưa có lịch sử sẽ bị xóa khỏi danh sách."}
              </p>
              {(deleteTarget.has_history || deleteTarget.demo_key) && <div className="adm-form-group">
                <label htmlFor="flight-cancel-reason">Lý do hủy chuyến</label>
                <textarea id="flight-cancel-reason" minLength={5} maxLength={1000} required value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)} placeholder="Nhập lý do để lưu vào các đặt chỗ bị ảnh hưởng" />
              </div>}

              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  className="btn-danger-confirm"
                  disabled={deleting || ((deleteTarget.has_history || deleteTarget.demo_key) && cancelReason.trim().length < 5)}
                  onClick={confirmDelete}
                >
                  {deleting ? "Đang xử lý..." : (deleteTarget.has_history || deleteTarget.demo_key ? "Xác nhận hủy chuyến" : "Xác nhận xóa")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default FlightManagement;
