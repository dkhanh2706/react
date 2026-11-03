import { getAuth, isAdminUser as checkIsAdmin } from "./utils/auth.js";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import ScrollToTop from "./components/common/ScrollToTop";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Home from "./pages/Home";

import Destinations from "./pages/Destinations";

import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";

import FlightResult from "./pages/FlightResult";
import FlightList from "./pages/FlightList";

import PassengerInfo from "./pages/PassengerInfo";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import PaymentResult from "./pages/PaymentResult";

import MyTickets from "./pages/MyTickets";
import MyOrders from "./pages/MyOrders";

import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import AdminDashboard from "./admin/AdminDashboard";
import UserManagement from "./admin/UserManagement";
import FlightManagement from "./admin/FlightManagement";
import PaymentManagement from "./admin/PaymentManagement";
import BookingManagement from "./admin/BookingManagement";
import ChatManagement from "./admin/ChatManagement";

import ProtectedRoute from "./components/common/ProtectedRoute";
import ChatbotWrapper from "./components/chat/ChatbotWrapper";
import AdminChatProvider from "./contexts/AdminChatProvider";

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

function HomeRoute() {
  return <Home />;
}

function CustomerPublicRoute({ children }) {
  return children;
}

function AdminRoute({ children }) {
  return <ProtectedRoute adminOnly>{children}</ProtectedRoute>;
}

function JourneyRoute({ component: Component }) {
  const location = useLocation();
  const flightId = new URLSearchParams(location.search).get("flightId") || location.state?.flight?.id || "";
  return <Component key={flightId} />;
}

function App() {
  return (
    <BrowserRouter>
      <AdminChatProvider>
      <ScrollToTop />
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
              <JourneyRoute component={PassengerInfo} />
            </ProtectedRoute>
          }
        />

        {/* BOOKING */}

        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <JourneyRoute component={Booking} />
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

        <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<Navigate to="/my-orders" replace />} />
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

        <Route path="/admin/bookings" element={<AdminRoute><BookingManagement /></AdminRoute>} />
        <Route path="/admin/chat" element={<AdminRoute><ChatManagement /></AdminRoute>} />

        {/* NOT FOUND */}

        <Route path="*" element={<NotFound />} />
      </Routes>

      <ChatbotWrapper />
      </AdminChatProvider>
    </BrowserRouter>
  );
}

export default App;
