import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Users,
  Shield,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Mail,
  Calendar,
} from "lucide-react";

import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin/UserManagement.css";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Modal Xóa
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // FETCH USERS
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("GET USERS ERROR:", error);
      toast.error(
        error.response?.data?.message || "Không thể tải danh sách tài khoản"
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ĐỔI QUYỀN
  const changeRole = async (id, role) => {
    try {
      await api.put(`/users/${id}/role`, { role });
      toast.success(`Đã cập nhật quyền thành: ${role}`);
      await fetchUsers();
    } catch (error) {
      console.error("UPDATE ROLE ERROR:", error);
      toast.error(error.response?.data?.message || "Không thể cập nhật quyền");
      await fetchUsers();
    }
  };

  // XÓA USER
  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success(`Đã xóa tài khoản ${deleteTarget.email || deleteTarget.full_name}`);
      setDeleteTarget(null);
      await fetchUsers();
    } catch (error) {
      console.error("DELETE USER ERROR:", error);
      toast.error(error.response?.data?.message || "Không thể xóa tài khoản");
    } finally {
      setDeleting(false);
    }
  };

  // FILTERED USERS
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = (u.full_name || u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      const matchSearch = !query || name.includes(query) || email.includes(query);
      const matchRole =
        roleFilter === "ALL" || String(u.role || "").toUpperCase() === roleFilter;

      return matchSearch && matchRole;
    });
  }, [users, searchQuery, roleFilter]);

  // STATS
  const totalUsers = users.length;
  const totalCustomers = users.filter((u) => u.role === "CUSTOMER").length;
  const totalAdmins = users.filter((u) => u.role === "ADMIN").length;

  const formatDate = (val) => {
    if (!val) return "---";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val).substring(0, 10);
    return d.toLocaleDateString("vi-VN");
  };

  return (
    <AdminLayout pageTitle="Quản lý tài khoản">
      <div className="adm-users-page">
        {/* ================= HEADER ================= */}
        <div className="adm-page-header-row">
          <div>
            <span className="adm-page-tag">IDENTITY & ACCESS CONTROL</span>
            <h1>Quản trị người dùng & Phân quyền</h1>
            <p>Kiểm soát tài khoản, phân quyền quản trị viên và theo dõi hoạt động đăng ký</p>
          </div>

          <button
            type="button"
            className="btn-refresh"
            onClick={fetchUsers}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Làm mới danh sách</span>
          </button>
        </div>

        {/* ================= STATS CARDS ================= */}
        <div className="adm-user-stats-row">
          <div className="u-stat-card">
            <div className="u-stat-icon blue">
              <Users size={22} />
            </div>
            <div>
              <span className="u-stat-label">Tổng số tài khoản</span>
              <strong className="u-stat-val">{totalUsers}</strong>
            </div>
          </div>

          <div className="u-stat-card">
            <div className="u-stat-icon green">
              <UserCheck size={22} />
            </div>
            <div>
              <span className="u-stat-label">Khách hàng (Customer)</span>
              <strong className="u-stat-val">{totalCustomers}</strong>
            </div>
          </div>

          <div className="u-stat-card">
            <div className="u-stat-icon purple">
              <Shield size={22} />
            </div>
            <div>
              <span className="u-stat-label">Quản trị viên (Admin)</span>
              <strong className="u-stat-val">{totalAdmins}</strong>
            </div>
          </div>
        </div>

        {/* ================= TABLE CARD ================= */}
        <div className="adm-content-card">
          {/* SEARCH & FILTER */}
          <div className="adm-table-toolbar">
            <div className="adm-search-input-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc email người dùng..."
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
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
                <option value="ADMIN">Quản trị viên (ADMIN)</option>
              </select>
            </div>
          </div>

          {/* TABLE CONTENT */}
          {loading ? (
            <div className="adm-table-empty-state">
              <div className="loading-spinner-circle" />
              <p>Đang tải danh sách người dùng...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="adm-table-empty-state">
              <span className="empty-glyph">👥</span>
              <h3>Không tìm thấy người dùng nào</h3>
              <p>Thử tìm kiếm với từ khóa hoặc bộ lọc quyền khác.</p>
            </div>
          ) : (
            <div className="adm-table-responsive">
              <table className="adm-modern-table">
                <thead>
                  <tr>
                    <th>Người dùng / Email</th>
                    <th>Số điện thoại</th>
                    <th>Vai trò hiện tại</th>
                    <th>Ngày tham gia</th>
                    <th>Phân quyền</th>
                    <th className="text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const displayName = u.full_name || u.name || "Chưa đặt tên";
                    const initial = displayName.trim().charAt(0).toUpperCase() || "U";
                    const isAdmin = u.role === "ADMIN";

                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="user-profile-cell">
                            <div className={`user-table-avatar ${isAdmin ? "admin-avatar" : ""}`}>
                              {initial}
                            </div>
                            <div>
                              <strong className="user-name-text">{displayName}</strong>
                              <span className="user-email-text">
                                <Mail size={12} style={{ display: "inline", marginRight: 4 }} />
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="phone-text">{u.phone || "Chưa cập nhật"}</span>
                        </td>
                        <td>
                          <span className={`role-badge ${isAdmin ? "admin" : "customer"}`}>
                            {isAdmin ? "ADMIN" : "CUSTOMER"}
                          </span>
                        </td>
                        <td>
                          <span className="date-text">
                            <Calendar size={12} style={{ display: "inline", marginRight: 4 }} />
                            {formatDate(u.created_at)}
                          </span>
                        </td>
                        <td>
                          <select
                            className="role-select-input"
                            value={u.role || "CUSTOMER"}
                            onChange={(e) => changeRole(u.id, e.target.value)}
                          >
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            className="btn-action delete"
                            onClick={() => setDeleteTarget(u)}
                            title="Xóa tài khoản"
                          >
                            <Trash2 size={15} />
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

        {/* ================= MODAL XÁC NHẬN XÓA ================= */}
        {deleteTarget && (
          <div className="adm-modal-overlay">
            <div className="adm-modal-card confirm-modal">
              <div className="confirm-icon-box">
                <AlertTriangle size={36} />
              </div>
              <h3>Xác nhận xóa tài khoản?</h3>
              <p>
                Bạn có chắc chắn muốn xóa tài khoản{" "}
                <strong>{deleteTarget.email || deleteTarget.full_name}</strong> khỏi hệ thống? Tất cả dữ liệu liên quan sẽ bị xóa.
              </p>
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
                  disabled={deleting}
                  onClick={confirmDeleteUser}
                >
                  {deleting ? "Đang xóa..." : "Xác nhận xóa"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default UserManagement;
