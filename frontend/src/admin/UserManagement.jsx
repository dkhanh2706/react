import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import "../styles/admin/UserManagement.css";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ==========================
  // LẤY DANH SÁCH USER
  // ==========================
  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");

      console.log("USERS RESPONSE:", response.data);

      setUsers(response.data);
    } catch (error) {
      console.error("GET USERS ERROR:", error);
      console.error("STATUS:", error.response?.status);
      console.error("DATA:", error.response?.data);

      toast.error(
        error.response?.data?.message || "Không thể lấy danh sách tài khoản",
      );

      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // LOAD DATA
  // ==========================
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // ==========================
  // ĐỔI QUYỀN
  // ==========================
  const changeRole = async (id, role) => {
    try {
      await api.put(`/users/${id}/role`, {
        role,
      });

      toast.success("Cập nhật quyền thành công");

      await fetchUsers();
    } catch (error) {
      console.error("UPDATE ROLE ERROR:", error);

      toast.error(error.response?.data?.message || "Không thể cập nhật quyền");

      await fetchUsers();
    }
  };

  // ==========================
  // MỞ MODAL XÓA
  // ==========================
  const openDeleteModal = (user) => {
    setDeleteTarget(user);
  };

  // ==========================
  // ĐÓNG MODAL
  // ==========================
  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteTarget(null);
  };

  // ==========================
  // XÁC NHẬN XÓA
  // ==========================
  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      await api.delete(`/users/${deleteTarget.id}`);

      toast.success("Đã xóa tài khoản");

      setDeleteTarget(null);

      await fetchUsers();
    } catch (error) {
      console.error("DELETE USER ERROR:", error);

      toast.error(error.response?.data?.message || "Không thể xóa tài khoản");
    } finally {
      setDeleting(false);
    }
  };

  // ==========================
  // THỐNG KÊ
  // ==========================
  const totalUsers = users.length;

  const totalCustomers = users.filter(
    (user) => user.role === "CUSTOMER",
  ).length;

  const totalAdmins = users.filter((user) => user.role === "ADMIN").length;

  // ==========================
  // LOADING
  // ==========================
  if (loading) {
    return (
      <div className="user-page">
        <div className="user-loading-card">
          <div className="user-spinner"></div>

          <p>Đang tải danh sách tài khoản...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-page">
      {/* HEADER */}
      <div className="user-page-header">
        <div>
          <p className="user-page-eyebrow">ADMINISTRATION</p>

          <h1>Quản lý tài khoản</h1>

          <p className="user-page-description">
            Theo dõi, phân quyền và quản lý tài khoản người dùng trong hệ thống.
          </p>
        </div>

        <button className="refresh-button" onClick={fetchUsers}>
          <span className="refresh-icon">↻</span>
          Làm mới
        </button>
      </div>

      {/* STATISTICS */}
      <div className="user-stats-grid">
        <div className="user-stat-card">
          <div className="stat-icon stat-icon-blue">👥</div>

          <div>
            <p className="stat-label">Tổng tài khoản</p>

            <h3>{totalUsers}</h3>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-icon stat-icon-green">👤</div>

          <div>
            <p className="stat-label">Khách hàng</p>

            <h3>{totalCustomers}</h3>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-icon stat-icon-purple">🛡️</div>

          <div>
            <p className="stat-label">Quản trị viên</p>

            <h3>{totalAdmins}</h3>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="user-table-card">
        <div className="user-table-header">
          <div>
            <h2>Danh sách tài khoản</h2>

            <p>Có {totalUsers} tài khoản trong hệ thống</p>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="user-empty-state">
            <div className="empty-icon">👤</div>

            <h3>Chưa có tài khoản</h3>

            <p>Hiện tại hệ thống chưa có tài khoản nào.</p>
          </div>
        ) : (
          <div className="user-table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>

                  <th>Người dùng</th>

                  <th>Email</th>

                  <th>Số điện thoại</th>

                  <th>Quyền</th>

                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const isMainAdmin = user.email === "adminhdk@gmail.com";

                  return (
                    <tr key={user.id}>
                      <td>
                        <span className="user-id">#{user.id}</span>
                      </td>

                      <td>
                        <div className="user-info-cell">
                          <div className="user-avatar">
                            {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                          </div>

                          <div>
                            <p className="user-name">{user.full_name}</p>

                            {isMainAdmin && (
                              <span className="main-admin-text">
                                Admin chính
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="user-email">{user.email}</span>
                      </td>

                      <td>
                        {user.phone || (
                          <span className="empty-value">Chưa cập nhật</span>
                        )}
                      </td>

                      <td>
                        {isMainAdmin ? (
                          <span className="role-badge role-admin">ADMIN</span>
                        ) : (
                          <select
                            className="role-select"
                            value={user.role}
                            onChange={(e) =>
                              changeRole(user.id, e.target.value)
                            }
                          >
                            <option value="CUSTOMER">CUSTOMER</option>
                          </select>
                        )}
                      </td>

                      <td>
                        {isMainAdmin ? (
                          <span className="protected-account">Được bảo vệ</span>
                        ) : (
                          <button
                            className="delete-user-button"
                            onClick={() => openDeleteModal(user)}
                          >
                            <span>🗑</span>
                            Xóa
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div className="delete-modal-overlay" onClick={closeDeleteModal}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">🗑</div>

            <h2>Xóa tài khoản?</h2>

            <p className="delete-modal-description">
              Bạn có chắc muốn xóa tài khoản
            </p>

            <div className="delete-user-preview">
              <div className="delete-user-avatar">
                {deleteTarget.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div>
                <strong>{deleteTarget.full_name}</strong>

                <span>{deleteTarget.email}</span>
              </div>
            </div>

            <p className="delete-warning-text">
              Hành động này không thể hoàn tác.
            </p>

            <div className="delete-modal-actions">
              <button
                className="cancel-delete-button"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Hủy
              </button>

              <button
                className="confirm-delete-button"
                onClick={confirmDeleteUser}
                disabled={deleting}
              >
                {deleting ? "Đang xóa..." : "Xóa tài khoản"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
