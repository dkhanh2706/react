import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../api/axios";

function UserManagement() {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  // ==========================
  // LẤY DANH SÁCH USER
  // ==========================

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get(
        "/users",

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setUsers(response.data);
    } catch {
      toast.error("Không thể lấy danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // LOAD DATA
  // ==========================

  useEffect(() => {
    const loadUsers = async () => {
      await fetchUsers();
    };

    loadUsers();
  }, []);

  // ==========================
  // ĐỔI QUYỀN
  // ==========================

  const changeRole = async (id, role) => {
    try {
      const token = localStorage.getItem("token");

      await api.put(
        `/users/${id}/role`,

        {
          role,
        },

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Cập nhật quyền thành công");

      fetchUsers();
    } catch {
      toast.error("Không thể cập nhật quyền");
    }
  };

  // ==========================
  // XÓA USER
  // ==========================

  const deleteUser = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa tài khoản này?");

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await api.delete(
        `/users/${id}`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Đã xóa tài khoản");

      fetchUsers();
    } catch {
      toast.error("Không thể xóa tài khoản");
    }
  };

  if (loading) {
    return <h2>Đang tải dữ liệu...</h2>;
  }

  return (
    <div
      style={{
        padding: "30px",
      }}
    >
      <h1>Quản lý tài khoản</h1>

      <table
        style={{
          width: "100%",

          marginTop: "20px",

          background: "#fff",

          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th>ID</th>

            <th>Họ tên</th>

            <th>Email</th>

            <th>Số điện thoại</th>

            <th>Quyền</th>

            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>

              <td>{user.full_name}</td>

              <td>{user.email}</td>

              <td>{user.phone || "-"}</td>

              <td>
                <select
                  value={user.role}
                  onChange={(e) =>
                    changeRole(
                      user.id,

                      e.target.value,
                    )
                  }
                >
                  <option value="CUSTOMER">CUSTOMER</option>

                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>

              <td>
                {user.email !== "admin@gmail.com" && (
                  <button onClick={() => deleteUser(user.id)}>Xóa</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserManagement;
