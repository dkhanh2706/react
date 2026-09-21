import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import FlightResult from "./pages/FlightResult";

// thêm mới
import FlightList from "./pages/FlightList";
import Booking from "./pages/Booking";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}

        <Route path="/login" element={<Login />} />

        {/* Register */}

        <Route path="/register" element={<Register />} />

        {/* Home */}

        <Route path="/home" element={<Home />} />

        {/* Forgot password */}

        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Reset password */}

        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Flight Result cũ */}

        <Route path="/flights" element={<FlightResult />} />

        {/* Flight List mới */}

        <Route path="/flight-list" element={<FlightList />} />

        {/* Booking mới */}

        <Route path="/booking" element={<Booking />} />

        {/* mặc định */}

        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
