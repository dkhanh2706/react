const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/database");

// =======================
// ROUTES
// =======================
const authRoutes = require("./routes/auth.routes");
const flightRoutes = require("./routes/flight.routes");
const seatRoutes = require("./routes/seat.routes");
const bookingRoutes = require("./routes/booking.routes");
const userRoutes = require("./routes/user.routes");

// PAYMENT / MOMO
const paymentRoutes = require("./routes/payment.routes");

// =======================
// CREATE APP
// =======================
const app = express();

// =======================
// MIDDLEWARE
// =======================

// Cho phép frontend React gọi backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Đọc JSON body
app.use(express.json());

// Đọc form/urlencoded nếu cần
app.use(
  express.urlencoded({
    extended: true,
  }),
);

// =======================
// TEST DATABASE
// =======================
app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT current_database();");

    return res.status(200).json({
      message: "Backend + Database OK",
      database: result.rows[0],
    });
  } catch (error) {
    console.error("DATABASE CONNECTION ERROR:", error);

    return res.status(500).json({
      message: "Database connection error",
      error: error.message,
    });
  }
});

// =======================
// AUTH ROUTES
// =======================
app.use("/api/auth", authRoutes);

// =======================
// FLIGHT ROUTES
// =======================
app.use("/api/flights", flightRoutes);

// =======================
// SEAT ROUTES
// =======================
app.use("/api/seats", seatRoutes);

// =======================
// BOOKING ROUTES
// =======================
app.use("/api/bookings", bookingRoutes);

// =======================
// USER MANAGEMENT ROUTES
// ADMIN
// =======================
app.use("/api/users", userRoutes);

// =======================
// PAYMENT ROUTES
// MOMO
// =======================
app.use("/api/payments", paymentRoutes);

// =======================
// TEST API
// =======================
app.get("/api/test", (req, res) => {
  return res.status(200).json({
    message: "API TEST OK",
  });
});

// =======================
// 404 HANDLER
// =======================
app.use((req, res) => {
  return res.status(404).json({
    message: "API route not found",
    path: req.originalUrl,
  });
});

// =======================
// ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  return res.status(500).json({
    message: "Server error",
    error: err.message,
  });
});

// =======================
// START SERVER
// =======================

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);

  console.log(
    `Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`,
  );
});
