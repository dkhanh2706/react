import { Navigate, useLocation } from "react-router-dom";

const ADMIN_EMAIL = "adminhdk@gmail.com";

function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();

  // =========================
  // LẤY TOKEN
  // =========================

  const token = localStorage.getItem("token");

  // =========================
  // LẤY USER
  // =========================

  let user = null;

  try {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Lỗi đọc user:", error);

    localStorage.removeItem("user");
  }

  // =========================
  // CHƯA ĐĂNG NHẬP
  // =========================

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // =========================
  // KIỂM TRA ADMIN
  // =========================

  const isAdmin =
    user?.role === "ADMIN" ||
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Route yêu cầu ADMIN nhưng user không phải ADMIN
  if (adminOnly && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  // =========================
  // HỢP LỆ
  // =========================

  return children;
}

export default ProtectedRoute;
