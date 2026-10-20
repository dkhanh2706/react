import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";

import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Calendar,
  Plane,
  Eye,
} from "lucide-react";

import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin/PaymentManagement.css";

const statusNames = { SUCCESS: "Thành công", PENDING: "Chờ thanh toán", FAILED: "Thất bại", EXPIRED: "Hết hạn", CANCELLED: "Đã hủy", PAYMENT_REVIEW: "Cần đối soát", REFUNDED: "Đã hoàn tiền" };
const paymentStatus = item => item.review_status === "OPEN" ? "PAYMENT_REVIEW" :
  ((!item.payment_status || item.payment_status === "PENDING") && ["EXPIRED", "CANCELLED", "PAYMENT_REVIEW"].includes(item.booking_status) ? item.booking_status : item.payment_status || item.booking_status);

function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");

  // Selected for view detail
  const [selectedPayment, setSelectedPayment] = useState(null);

  // =====================================================
  // FETCH PAYMENTS - dùng cho nút "Làm mới dữ liệu"
  // =====================================================
  const fetchPayments = async () => {
    try {
      setLoading(true);

      const response = await api.get("/payments");

      const data = Array.isArray(response.data?.data) ? response.data.data : [];

      setPayments(data);
    } catch (error) {
      console.error("GET PAYMENTS ERROR:", error);

      toast.error(
        error.response?.data?.message || "Không thể tải danh sách thanh toán",
      );

      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD LẦN ĐẦU KHI MỞ TRANG
  // =====================================================
  useEffect(() => {
    let cancelled = false;

    api
      .get("/payments")
      .then((response) => {
        if (cancelled) return;

        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setPayments(data);
      })
      .catch((error) => {
        if (cancelled) return;

        console.error("GET PAYMENTS ERROR:", error);

        toast.error(
          error.response?.data?.message || "Không thể tải danh sách thanh toán",
        );

        setPayments([]);
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
  // FILTERED PAYMENTS
  // =====================================================
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      const code = (item.booking_code || "").toLowerCase();
      const email = (item.customer_email || "").toLowerCase();
      const name = (item.customer_name || "").toLowerCase();
      const flightNum = (item.flight_number_snapshot || "").toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      const matchSearch =
        !query ||
        code.includes(query) ||
        email.includes(query) ||
        name.includes(query) ||
        flightNum.includes(query);

      const status = paymentStatus(item);
      const matchStatus = statusFilter === "ALL" || statusFilter === status;

      const method = String(item.payment_method || "").toUpperCase();

      const matchMethod =
        methodFilter === "ALL" || method.includes(methodFilter);

      return matchSearch && matchStatus && matchMethod;
    });
  }, [payments, searchQuery, statusFilter, methodFilter]);

  // =====================================================
  // STATISTICS
  // =====================================================
  const totalTransactions = payments.filter(p => p.payment_id).length;

  const successfulPayments = payments.filter(
    (p) => p.payment_status === "SUCCESS",
  );

  const totalRevenue = successfulPayments.filter(p => p.payment_method === "MOMO" && p.booking_status === "CONFIRMED" && p.review_status !== "OPEN").reduce(
    (sum, p) => sum + Number(p.payment_amount || p.total_price || 0),
    0,
  );

  const pendingCount = payments.filter(
    (p) => paymentStatus(p) === "PENDING",
  ).length;

  // =====================================================
  // FORMAT PRICE
  // =====================================================
  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("vi-VN");
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================
  const formatDate = (val) => {
    if (!val) return "---";

    const d = new Date(val);

    if (Number.isNaN(d.getTime())) {
      return String(val).substring(0, 10);
    }

    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout pageTitle="Quản lý thanh toán">
      <div className="adm-payments-page">
        {/* ================= HEADER ================= */}
        <div className="adm-page-header-row">
          <div>
            <span className="adm-page-tag">FINANCIAL & TRANSACTIONS</span>

            <h1>Quản trị Thanh toán & Đặt vé</h1>

            <p>
              Theo dõi chi tiết tất cả các giao dịch đặt vé máy bay, tài khoản
              người mua và doanh thu hệ thống
            </p>
          </div>

          <button
            type="button"
            className="btn-refresh"
            onClick={fetchPayments}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />

            <span>{loading ? "Đang tải..." : "Làm mới dữ liệu"}</span>
          </button>
        </div>

        {/* ================= STATS CARDS ================= */}
        <div className="adm-payment-stats-row">
          <div className="p-stat-card">
            <div className="p-stat-icon purple">
              <DollarSign size={22} />
            </div>

            <div>
              <span className="p-stat-label">Doanh thu vé MoMo</span>

              <strong className="p-stat-val">
                {formatPrice(totalRevenue)}{" "}
                <small
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  VND
                </small>
              </strong>
            </div>
          </div>

          <div className="p-stat-card">
            <div className="p-stat-icon green">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <span className="p-stat-label">Giao dịch thành công</span>

              <strong className="p-stat-val">
                {successfulPayments.length}
              </strong>
            </div>
          </div>

          <div className="p-stat-card">
            <div className="p-stat-icon amber">
              <Clock size={22} />
            </div>

            <div>
              <span className="p-stat-label">Đang chờ xử lý</span>

              <strong className="p-stat-val">{pendingCount}</strong>
            </div>
          </div>

          <div className="p-stat-card">
            <div className="p-stat-icon blue">
              <CreditCard size={22} />
            </div>

            <div>
              <span className="p-stat-label">Tổng số giao dịch</span>

              <strong className="p-stat-val">{totalTransactions}</strong>
            </div>
          </div>
        </div>

        {/* ================= TABLE CARD ================= */}
        <div className="adm-content-card">
          {/* SEARCH & FILTER TOOLBAR */}
          <div className="adm-table-toolbar">
            <div className="adm-search-input-box">
              <Search size={18} className="search-icon" />

              <input
                type="text"
                placeholder="Tìm theo mã vé, email, tên khách, chuyến bay..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>

                <option value="SUCCESS">Thành công / Đã thanh toán</option>

                <option value="PENDING">Chờ thanh toán</option>

                <option value="FAILED">Thất bại</option>
                <option value="EXPIRED">Hết hạn</option>
                <option value="CANCELLED">Đã hủy</option>
                <option value="PAYMENT_REVIEW">Cần đối soát</option>
                <option value="REFUNDED">Đã hoàn tiền</option>
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="ALL">Mọi phương thức</option>

                <option value="MOMO">Ví MoMo</option>

                <option value="MOCK">Thử nghiệm (MOCK)</option>
              </select>
            </div>
          </div>

          {/* TABLE CONTENT */}
          {loading ? (
            <div className="adm-table-empty-state">
              <div className="loading-spinner-circle" />

              <p>Đang tải danh sách thanh toán & vé đã mua...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="adm-table-empty-state">
              <span className="empty-glyph">💳</span>

              <h3>Chưa có giao dịch nào</h3>

              <p>
                Hiện chưa có khách hàng nào đặt vé hoặc không tìm thấy kết quả
                phù hợp với bộ lọc.
              </p>
            </div>
          ) : (
            <div className="adm-table-responsive">
              <table className="adm-modern-table">
                <thead>
                  <tr>
                    <th>Mã đặt vé / Thời gian</th>

                    <th>Tài khoản người mua</th>

                    <th>Chuyến bay & Ghế</th>

                    <th>Phương thức</th>

                    <th>Số tiền</th>

                    <th>Trạng thái</th>

                    <th className="text-right">Chi tiết</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPayments.map((p) => {
                    const status = paymentStatus(p);
                    const isSuccess = status === "SUCCESS";
                    const isPending = status === "PENDING";
                    const method = String(
                      p.payment_method || "Chưa tạo",
                    ).toUpperCase();

                    const custName = p.customer_name || "Khách vãng lai";

                    const custEmail = p.customer_email || "Chưa có email";

                    return (
                      <tr key={p.payment_id || `booking-${p.booking_id}`}>
                        {/* MÃ ĐẶT VÉ & NGÀY */}
                        <td>
                          <div className="booking-code-cell">
                            <span className="booking-code-val">
                              {p.booking_code || `BK-${p.booking_id}`}
                            </span>

                            <span className="date-text">
                              <Calendar
                                size={11}
                                style={{
                                  display: "inline",
                                  marginRight: 3,
                                }}
                              />

                              {formatDate(p.paid_at || p.booking_date)}
                            </span>
                          </div>
                        </td>

                        {/* TÀI KHOẢN NGƯỜI MUA */}
                        <td>
                          <div className="user-profile-cell">
                            <div className="user-table-avatar">
                              {custName.trim().charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <strong className="user-name-text">
                                {custName}
                              </strong>

                              <span className="user-email-text">
                                <Mail
                                  size={11}
                                  style={{
                                    display: "inline",
                                    marginRight: 3,
                                  }}
                                />

                                {custEmail}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* CHUYẾN BAY & GHẾ */}
                        <td>
                          <div className="flight-cell">
                            <span className="route-text">
                              {p.departure_place && p.arrival_place
                                ? `${p.departure_place} → ${p.arrival_place}`
                                : p.airline_name || "Chuyến bay nội địa"}
                            </span>

                            <div className="flight-meta-sub">
                              {p.flight_number_snapshot && (
                                <span>
                                  <Plane
                                    size={11}
                                    style={{
                                      display: "inline",
                                      marginRight: 3,
                                    }}
                                  />

                                  {p.flight_number_snapshot}
                                </span>
                              )}

                              {p.seat_number_snapshot && (
                                <span className="seat-tag">
                                  Ghế: {p.seat_number_snapshot} (
                                  {p.seat_class || "ECO"})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* PHƯƠNG THỨC */}
                        <td>
                          <span
                            className={`method-tag ${
                              method.includes("MOMO") ? "momo" : "mock"
                            }`}
                          >
                            {method.includes("MOMO")
                              ? "Ví MoMo"
                              : method === "MOCK" ? "Giả lập (MOCK)" : "Chưa tạo thanh toán"}
                          </span>
                        </td>

                        {/* SỐ TIỀN */}
                        <td>
                          <strong className="price-text">
                            {formatPrice(p.payment_amount || p.total_price)}

                            <span className="price-unit">₫</span>
                          </strong>
                        </td>

                        {/* TRẠNG THÁI */}
                        <td>
                          {isSuccess ? (
                            <span className="pay-status-badge success">
                              <CheckCircle2 size={12} />
                              Thành công
                            </span>
                          ) : isPending ? (
                            <span className="pay-status-badge pending">
                              <Clock size={12} />
                              Chờ thanh toán
                            </span>
                          ) : (
                            <span className="pay-status-badge failed">
                              {statusNames[status] || status}
                            </span>
                          )}
                        </td>

                        {/* CHI TIẾT */}
                        <td className="text-right">
                          <button
                            type="button"
                            className="btn-action edit"
                            onClick={() => setSelectedPayment(p)}
                            title="Xem chi tiết hóa đơn"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ================= MODAL ================= */}
        {selectedPayment && (
          <div className="adm-modal-overlay">
            <div className="adm-modal-card" style={{ maxWidth: 580 }}>
              <div className="adm-modal-head">
                <div>
                  <span className="adm-modal-tag">CHI TIẾT ĐƠN HÀNG</span>

                  <h3>
                    Hóa đơn #
                    {selectedPayment.booking_code || selectedPayment.booking_id}
                  </h3>
                </div>

                <button
                  type="button"
                  className="adm-modal-close"
                  onClick={() => setSelectedPayment(null)}
                >
                  ✕
                </button>
              </div>

              <div className="pay-detail-grid">
                <div className="pay-detail-item">
                  <label>Khách hàng</label>

                  <strong>
                    {selectedPayment.customer_name || "Chưa cập nhật"}
                  </strong>
                </div>

                <div className="pay-detail-item">
                  <label>Email tài khoản</label>

                  <span>{selectedPayment.customer_email || "---"}</span>
                </div>

                <div className="pay-detail-item">
                  <label>Số điện thoại</label>

                  <span>{selectedPayment.customer_phone || "---"}</span>
                </div>

                <div className="pay-detail-item">
                  <label>Thời gian giao dịch</label>

                  <span>
                    {formatDate(
                      selectedPayment.paid_at || selectedPayment.booking_date,
                    )}
                  </span>
                </div>

                <div className="pay-detail-item">
                  <label>Hãng bay / Số hiệu</label>

                  <span>
                    {selectedPayment.airline_name || "---"}{" "}
                    {selectedPayment.flight_number_snapshot
                      ? `(${selectedPayment.flight_number_snapshot})`
                      : ""}
                  </span>
                </div>

                <div className="pay-detail-item">
                  <label>Hành trình</label>

                  <strong>
                    {selectedPayment.departure_place || "---"} →{" "}
                    {selectedPayment.arrival_place || "---"}
                  </strong>
                </div>

                <div className="pay-detail-item">
                  <label>Số ghế & Hạng vé</label>

                  <span>
                    Ghế {selectedPayment.seat_number_snapshot || "---"} (
                    {selectedPayment.seat_class || "ECONOMY"})
                  </span>
                </div>

                <div className="pay-detail-item">
                  <label>Phương thức thanh toán</label>

                  <span
                    className={`method-tag ${
                      String(selectedPayment.payment_method || "")
                        .toUpperCase()
                        .includes("MOMO")
                        ? "momo"
                        : "mock"
                    }`}
                  >
                    {selectedPayment.payment_method || "Chưa tạo"}
                  </span>
                </div>

                <div
                  className="pay-detail-item full-width"
                  style={{
                    borderTop: "1px dashed #e2e8f0",
                    paddingTop: 12,
                  }}
                >
                  <label>Tổng tiền thanh toán</label>

                  <strong
                    style={{
                      fontSize: 20,
                      color: "#7c3aed",
                    }}
                  >
                    {formatPrice(
                      selectedPayment.payment_amount ||
                        selectedPayment.total_price,
                    )}{" "}
                    VND
                  </strong>
                </div>
              </div>

              <div className="adm-modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setSelectedPayment(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default PaymentManagement;
