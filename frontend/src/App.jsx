import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// =====================
// AUTH
// =====================

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// =====================
// HOME
// =====================

import Home from "./pages/Home";

// =====================
// FLIGHT
// =====================

import FlightResult from "./pages/FlightResult";
import FlightList from "./pages/FlightList";

// =====================
// BOOKING + PAYMENT
// =====================

import Booking from "./pages/Booking";
import Payment from "./pages/Payment";

// =====================
// ADMIN
// =====================

import AdminDashboard from "./admin/AdminDashboard";
import UserManagement from "./admin/UserManagement";
import FlightManagement from "./admin/FlightManagement";

// =====================
// PROTECTED
// =====================

import ProtectedRoute from "./components/ProtectedRoute";

const ADMIN_EMAIL = "adminhdk@gmail.com";

// =====================================================
// LẤY THÔNG TIN USER TỪ LOCAL STORAGE
// =====================================================

const getAuth = () => {
  const token = localStorage.getItem("token");

  let user = null;

  try {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Lỗi đọc user từ localStorage:", error);

    localStorage.removeItem("user");
  }

  return {
    token,
    user,
  };
};

// =====================================================
// KIỂM TRA ADMIN
// =====================================================

const checkIsAdmin = (user) => {
  if (!user) {
    return false;
  }

  return (
    user.role === "ADMIN" ||
    user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
};

// =====================================================
// ROUTE GỐC
// Khi mở localhost:5173
// =====================================================

function RootRedirect() {
  const { token, user } = getAuth();

  // Chưa đăng nhập
  if (!token) {
    return <Navigate to="/home" replace />;
  }

  // Đã đăng nhập ADMIN
  if (checkIsAdmin(user)) {
    return <Navigate to="/admin" replace />;
  }

  // CUSTOMER
  return <Navigate to="/home" replace />;
}

// =====================================================
// LOGIN ROUTE
// Nếu đã login rồi thì không cho quay lại login
// =====================================================

function LoginRoute() {
  const { token, user } = getAuth();

  if (!token) {
    return <Login />;
  }

  if (checkIsAdmin(user)) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/home" replace />;
}

// =====================================================
// HOME ROUTE
// ADMIN vào /home sẽ quay lại /admin
// =====================================================

function HomeRoute() {
  const { token, user } = getAuth();

  if (token && checkIsAdmin(user)) {
    return <Navigate to="/admin" replace />;
  }

  return <Home />;
}

// =====================================================
// ADMIN ROUTE
// Chỉ ADMIN mới được truy cập
// =====================================================

function AdminRoute({ children }) {
  const { token, user } = getAuth();

  // Chưa login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Có login nhưng không phải admin
  if (!checkIsAdmin(user)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

// =====================================================
// APP
// =====================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =====================
            AUTH
        ====================== */}

        <Route path="/login" element={<LoginRoute />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        {/* =====================
            ROOT
        ====================== */}

        <Route path="/" element={<RootRedirect />} />

        {/* =====================
            HOME
        ====================== */}

        <Route path="/home" element={<HomeRoute />} />

        {/* =====================
            FLIGHT SEARCH PUBLIC
        ====================== */}

        <Route path="/flights" element={<FlightResult />} />

        <Route path="/flight-list" element={<FlightList />} />

        {/* =====================
            CUSTOMER PRIVATE
        ====================== */}

        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        {/* =====================
            ADMIN
        ====================== */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/flights"
          element={
            <AdminRoute>
              <FlightManagement />
            </AdminRoute>
          }
        />

        {/* =====================
            NOT FOUND
        ====================== */}

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
