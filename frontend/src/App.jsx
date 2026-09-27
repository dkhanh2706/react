import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import FlightResult from "./pages/FlightResult";
import FlightList from "./pages/FlightList";

import Booking from "./pages/Booking";

import Payment from "./pages/Payment";

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
            HOME
        ====================== */}

        <Route path="/home" element={<Home />} />

        {/* =====================
            FLIGHT
        ====================== */}

        {/* Kết quả tìm kiếm cũ */}

        <Route path="/flights" element={<FlightResult />} />

        {/* Danh sách chuyến bay */}

        <Route path="/flight-list" element={<FlightList />} />

        {/* =====================
            BOOKING
        ====================== */}

        <Route path="/booking" element={<Booking />} />

        {/* =====================
            PAYMENT
        ====================== */}

        <Route path="/payment" element={<Payment />} />

        {/* =====================
            DEFAULT
        ====================== */}

        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
