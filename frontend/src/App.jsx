import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

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
// BLOG
// =====================================================

import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";

// =====================================================
// FLIGHT
// =====================================================

import FlightResult from "./pages/FlightResult";
import FlightList from "./pages/FlightList";

// =====================================================
// BOOKING + PASSENGER + PAYMENT
// =====================================================

import PassengerInfo from "./pages/PassengerInfo";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import PaymentResult from "./pages/PaymentResult";

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
import PaymentManagement from "./admin/PaymentManagement";

// =====================================================
// COMPONENTS
// =====================================================

import ProtectedRoute from "./components/ProtectedRoute";
import ChatbotWrapper from "./components/ChatbotWrapper";

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

  if (!token) {
    return <Navigate to="/home" replace />;
  }

  if (checkIsAdmin(user)) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/home" replace />;
}

// =====================================================
// LOGIN ROUTE
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
// =====================================================

function HomeRoute() {
  const { token, user } = getAuth();

  if (token && checkIsAdmin(user)) {
    return <Navigate to="/admin" replace />;
  }

  return <Home />;
}

// =====================================================
// CUSTOMER PUBLIC ROUTE
// =====================================================

function CustomerPublicRoute({ children }) {
  const { token, user } = getAuth();

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

  if (!token) {
    return <Navigate to="/login" replace />;
  }

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
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{
          zIndex: 9999999,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#1f2937",
            fontWeight: 600,
            padding: "14px 18px",
            borderRadius: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          },
          success: {
            duration: 3500,
          },
          error: {
            duration: 5000,
          },
        }}
      />

      <Routes>
        {/* AUTH */}

        <Route path="/login" element={<LoginRoute />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ROOT */}

        <Route path="/" element={<RootRedirect />} />

        {/* HOME */}

        <Route path="/home" element={<HomeRoute />} />

        {/* DESTINATIONS */}

        <Route
          path="/destinations"
          element={
            <CustomerPublicRoute>
              <Destinations />
            </CustomerPublicRoute>
          }
        />

        {/* BLOG */}

        <Route
          path="/blog"
          element={
            <CustomerPublicRoute>
              <Blog />
            </CustomerPublicRoute>
          }
        />

        <Route
          path="/blog/:slug"
          element={
            <CustomerPublicRoute>
              <BlogDetail />
            </CustomerPublicRoute>
          }
        />

        {/* FLIGHT SEARCH */}

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

        {/* PASSENGER INFO */}

        <Route
          path="/passenger-info"
          element={
            <ProtectedRoute>
              <PassengerInfo />
            </ProtectedRoute>
          }
        />

        {/* BOOKING */}

        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />

        {/* PAYMENT */}

        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        {/* MOMO RESULT */}

        <Route
          path="/payment-result"
          element={
            <ProtectedRoute>
              <PaymentResult />
            </ProtectedRoute>
          }
        />

        {/* PROFILE */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* MY TICKETS */}

        <Route
          path="/my-tickets"
          element={
            <ProtectedRoute>
              <MyTickets />
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}

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

        <Route
          path="/admin/payments"
          element={
            <AdminRoute>
              <PaymentManagement />
            </AdminRoute>
          }
        />

        {/* NOT FOUND */}

        <Route path="*" element={<RootRedirect />} />
      </Routes>

      <ChatbotWrapper />
    </BrowserRouter>
  );
}

export default App;
