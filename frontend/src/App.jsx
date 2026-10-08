import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// =====================================================
// AUTH
// =====================================================

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// =====================================================
// HOME
// =====================================================

import Home from "./pages/Home";

// =====================================================
// DESTINATIONS
// =====================================================

import Destinations from "./pages/Destinations";

// =====================================================
// FLIGHT
// =====================================================

import FlightResult from "./pages/FlightResult";
import FlightList from "./pages/FlightList";

// =====================================================
// BOOKING + PAYMENT
// =====================================================

import Booking from "./pages/Booking";
import Payment from "./pages/Payment";

// =====================================================
// MY TICKETS
// =====================================================

import MyTickets from "./pages/MyTickets";

// =====================================================
// PROFILE
// =====================================================

import Profile from "./pages/Profile";

// =====================================================
// ADMIN
// =====================================================

import AdminDashboard from "./admin/AdminDashboard";
import UserManagement from "./admin/UserManagement";
import FlightManagement from "./admin/FlightManagement";

// =====================================================
// PROTECTED ROUTE
// =====================================================

import ProtectedRoute from "./components/ProtectedRoute";

// =====================================================
// ADMIN EMAIL
// =====================================================

const ADMIN_EMAIL = "adminhdk@gmail.com";

// =====================================================
// LẤY THÔNG TIN ĐĂNG NHẬP TỪ LOCALSTORAGE
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
// =====================================================

function RootRedirect() {
  const { token, user } = getAuth();

  // Chưa đăng nhập
  if (!token) {
    return <Navigate to="/home" replace />;
  }

  // Admin
  if (checkIsAdmin(user)) {
    return <Navigate to="/admin" replace />;
  }

  // Customer
  return <Navigate to="/home" replace />;
}

// =====================================================
// LOGIN ROUTE
// =====================================================

function LoginRoute() {
  const { token, user } = getAuth();

  // Chưa đăng nhập
  if (!token) {
    return <Login />;
  }

  // Admin đã đăng nhập
  if (checkIsAdmin(user)) {
    return <Navigate to="/admin" replace />;
  }

  // Customer đã đăng nhập
  return <Navigate to="/home" replace />;
}

// =====================================================
// HOME ROUTE
// =====================================================

function HomeRoute() {
  const { token, user } = getAuth();

  // Admin không vào trang customer
  if (token && checkIsAdmin(user)) {
    return <Navigate to="/admin" replace />;
  }

  return <Home />;
}

// =====================================================
// CUSTOMER PUBLIC ROUTE
// Dùng cho các trang khách có thể xem mà không cần đăng nhập
// =====================================================

function CustomerPublicRoute({ children }) {
  const { token, user } = getAuth();

  // Admin không vào giao diện customer
  if (token && checkIsAdmin(user)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

// =====================================================
// ADMIN ROUTE
// =====================================================

function AdminRoute({ children }) {
  const { token, user } = getAuth();

  // Chưa đăng nhập
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Không phải admin
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
        {/* =================================================
            AUTH
        ================================================= */}

        <Route path="/login" element={<LoginRoute />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        {/* =================================================
            ROOT
        ================================================= */}

        <Route path="/" element={<RootRedirect />} />

        {/* =================================================
            HOME
        ================================================= */}

        <Route path="/home" element={<HomeRoute />} />

        {/* =================================================
            DESTINATIONS
        ================================================= */}

        <Route
          path="/destinations"
          element={
            <CustomerPublicRoute>
              <Destinations />
            </CustomerPublicRoute>
          }
        />

        {/* =================================================
            FLIGHT SEARCH
        ================================================= */}

        <Route
          path="/flights"
          element={
            <CustomerPublicRoute>
              <FlightResult />
            </CustomerPublicRoute>
          }
        />

        <Route
          path="/flight-list"
          element={
            <CustomerPublicRoute>
              <FlightList />
            </CustomerPublicRoute>
          }
        />

        {/* =================================================
            BOOKING
        ================================================= */}

        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            PAYMENT
        ================================================= */}

        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            PROFILE
        ================================================= */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            VÉ MÁY BAY CỦA TÔI
        ================================================= */}

        <Route
          path="/my-tickets"
          element={
            <ProtectedRoute>
              <MyTickets />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ADMIN DASHBOARD
        ================================================= */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* =================================================
            ADMIN - USERS
        ================================================= */}

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />

        {/* =================================================
            ADMIN - FLIGHTS
        ================================================= */}

        <Route
          path="/admin/flights"
          element={
            <AdminRoute>
              <FlightManagement />
            </AdminRoute>
          }
        />

        {/* =================================================
            NOT FOUND
        ================================================= */}

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
