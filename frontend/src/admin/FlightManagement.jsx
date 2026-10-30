import { formatNumber } from "../utils/format.js";
import FlightTable from "../components/admin/flights/FlightTable.jsx";
import FlightCancelModal from "../components/admin/flights/FlightCancelModal.jsx";
import FlightFormModal from "../components/admin/flights/FlightFormModal.jsx";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";

import { Plane, Plus, Search, Filter, RefreshCw, DollarSign } from "lucide-react";

import api from "../api/axios";
import AdminLayout from "../layouts/AdminLayout";
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
                {formatNumber(avgPrice)}đ
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
            <FlightTable visibleFlights={visibleFlights} openEditModal={openEditModal} setDeleteTarget={setDeleteTarget} setCancelReason={setCancelReason} filteredFlights={filteredFlights} visiblePage={visiblePage} setTablePage={setTablePage} tablePages={tablePages} />
          )}
        </div>

        {/* ================= MODAL TẠO / SỬA ================= */}
        {isModalOpen && (
          <FlightFormModal editId={editId} setIsModalOpen={setIsModalOpen} handleSubmit={handleSubmit} flights={flights} form={form} handleChange={handleChange} AIRLINES={AIRLINES} catalog={catalog} AIRPORTS={AIRPORTS} submitting={submitting} />
        )}

        {/* ================= MODAL XÓA ================= */}
        {deleteTarget && (
          <FlightCancelModal deleteTarget={deleteTarget} cancelReason={cancelReason} setCancelReason={setCancelReason} deleting={deleting} setDeleteTarget={setDeleteTarget} confirmDelete={confirmDelete} />
        )}
      </div>
    </AdminLayout>
  );
}

export default FlightManagement;
