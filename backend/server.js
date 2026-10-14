const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/database");

// =====================================================
// HÀM ĐỌC ROUTER AN TOÀN
// =====================================================

function loadRouter(path, routeName) {
  const routeModule = require(path);

  // Trường hợp chuẩn:
  // module.exports = router;
  if (typeof routeModule === "function") {
    return routeModule;
  }

  // Trường hợp:
  // module.exports = { router };
  if (routeModule && typeof routeModule.router === "function") {
    console.warn(`[WARNING] ${routeName} đang export dạng { router }.`);

    return routeModule.router;
  }

  // Trường hợp:
  // exports.default = router;
  if (routeModule && typeof routeModule.default === "function") {
    console.warn(`[WARNING] ${routeName} đang export dạng default.`);

    return routeModule.default;
  }

  console.error(`❌ ROUTE ERROR: ${routeName} không phải Express Router`);

  console.error(`Đường dẫn: ${path}`);

  console.error("Giá trị export:", routeModule);

  throw new TypeError(
    `${routeName} không export Express Router. ` +
      `Cuối file route phải có: module.exports = router;`,
  );
}

// =====================================================
// ROUTES
// =====================================================

const authRoutes = loadRouter("./routes/auth.routes", "authRoutes");

const flightRoutes = loadRouter("./routes/flight.routes", "flightRoutes");

const seatRoutes = loadRouter("./routes/seat.routes", "seatRoutes");

const bookingRoutes = loadRouter("./routes/booking.routes", "bookingRoutes");

const userRoutes = loadRouter("./routes/user.routes", "userRoutes");

const paymentRoutes = loadRouter("./routes/payment.routes", "paymentRoutes");

// =====================================================
// CREATE APP
// =====================================================

const app = express();

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://192.168.1.9:5173",
  "http://192.168.190.70:5173",

  "http://192.168.1.138:5173",
];

// Nếu .env có FRONTEND_URL thì tự thêm vào
if (
  process.env.FRONTEND_URL &&
  !allowedOrigins.includes(process.env.FRONTEND_URL)
) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Postman / Thunder Client /
    // server callback không có origin
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn("CORS BLOCKED ORIGIN:", origin);

    return callback(new Error(`CORS không cho phép origin: ${origin}`));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// =====================================================
// BODY PARSER
// =====================================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// =====================================================
// LOG REQUEST
// =====================================================

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);

  next();
});

// =====================================================
// TEST DATABASE
// =====================================================

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

// =====================================================
// TEST API
// =====================================================

app.get("/api/test", (req, res) => {
  return res.status(200).json({
    message: "API TEST OK",
  });
});

// =====================================================
// ROUTES
// =====================================================

// AUTH
app.use("/api/auth", authRoutes);

// FLIGHTS
app.use("/api/flights", flightRoutes);

// SEATS
app.use("/api/seats", seatRoutes);

// BOOKINGS
app.use("/api/bookings", bookingRoutes);

// USERS / ADMIN
app.use("/api/users", userRoutes);

// PAYMENTS / MOMO
app.use("/api/payments", paymentRoutes);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  return res.status(404).json({
    message: "API route not found",

    path: req.originalUrl,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  // CORS
  if (err.message && err.message.includes("CORS không cho phép")) {
    return res.status(403).json({
      message: "CORS blocked",

      error: err.message,
    });
  }

  return res.status(500).json({
    message: "Server error",

    error: err.message,
  });
});

// =====================================================
// START SERVER
// =====================================================

const PORT = Number(process.env.PORT) || 5000;

const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log("======================================");

  console.log(`Backend running on port ${PORT}`);

  console.log(`Local: http://localhost:${PORT}`);

  console.log(`LAN: http://192.168.1.138:${PORT}`);

  console.log(
    `Frontend: ${process.env.FRONTEND_URL || "http://localhost:5173"}`,
  );

  console.log("Allowed CORS origins:", allowedOrigins);

  console.log("--------------------------------------");

  console.log("✅ authRoutes:", typeof authRoutes);

  console.log("✅ flightRoutes:", typeof flightRoutes);

  console.log("✅ seatRoutes:", typeof seatRoutes);

  console.log("✅ bookingRoutes:", typeof bookingRoutes);

  console.log("✅ userRoutes:", typeof userRoutes);

  console.log("✅ paymentRoutes:", typeof paymentRoutes);

  console.log("======================================");
});
