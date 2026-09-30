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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =====================
            AUTH
        ====================== */}

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        {/* =====================
            HOME PUBLIC
        ====================== */}

        <Route path="/" element={<Navigate to="/home" />} />

        <Route path="/home" element={<Home />} />

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
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/flights"
          element={
            <ProtectedRoute>
              <FlightManagement />
            </ProtectedRoute>
          }
        />

        {/* =====================
            NOT FOUND
        ====================== */}

        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
