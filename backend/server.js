const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { networkInterfaces } = require("node:os");
const { errorPayload, errorHandler } = require("./lib/errors");

require("dotenv").config();

const db = require("./config/database");

// =====================================================
// HÀM ĐỌC ROUTER AN TOÀN
// =====================================================

function loadRouter(routerPath, routeName) {
  const routeModule = require(routerPath);

  // module.exports = router
  if (typeof routeModule === "function") {
    return routeModule;
  }

  // module.exports = { router }
  if (routeModule && typeof routeModule.router === "function") {
    console.warn(`[WARNING] ${routeName} đang export dạng { router }.`);

    return routeModule.router;
  }

  // exports.default
  if (routeModule && typeof routeModule.default === "function") {
    console.warn(`[WARNING] ${routeName} đang export dạng default.`);

    return routeModule.default;
  }

  console.error(`❌ ROUTE ERROR: ${routeName} không phải Express Router`);
  console.error(`Đường dẫn: ${routerPath}`);
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

// CHATBOT AI
const chatRoutes = loadRouter("./routes/chat.routes", "chatRoutes");

// =====================================================
// CREATE APP
// =====================================================

const app = express();
require("./lib/localProxy")(app);

// =====================================================
// UPLOAD DIRECTORY
// =====================================================

const { uploadDirectory, avatarDirectory } = require("./config/uploads");

// Tự tạo folder nếu chưa có
fs.mkdirSync(avatarDirectory, {
  recursive: true,
});

// =====================================================
// CORS
// =====================================================

const allowedOrigins = process.env.NODE_ENV === "production" ? [] : [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

// Discover this machine's LAN addresses at startup for local development.
const lanAddresses = [
  ...new Set(
    Object.values(networkInterfaces())
      .flat()
      .filter((address) => address && address.family === "IPv4" && !address.internal)
      .map((address) => address.address),
  ),
];
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push(...lanAddresses.map((address) => `http://${address}:5173`));
}

// Nếu .env có FRONTEND_URL
for (const value of [process.env.FRONTEND_URL, ...(process.env.CORS_ORIGINS || "").split(",")]) {
  if (!value?.trim()) continue;
  const origin = new URL(value.trim()).origin;
  if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Postman / server callback / MoMo IPN
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn("CORS BLOCKED ORIGIN:", origin);

    return callback(
      Object.assign(new Error(`CORS không cho phép origin: ${origin}`), {
        code: "CORS_BLOCKED",
      }),
    );
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// =====================================================
// BODY PARSER
// =====================================================

app.use("/api/chat", express.json({ limit: "128kb" }));

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

// =====================================================
// STATIC FILE
// =====================================================

app.use(
  "/uploads",
  express.static(uploadDirectory, {
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);

// =====================================================
// LOG REQUEST
// =====================================================

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);

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

      ...(process.env.NODE_ENV !== "production"
        ? { database: result.rows[0] }
        : {}),
    });
  } catch (error) {
    console.error("DATABASE CONNECTION ERROR:", error);

    return res
      .status(500)
      .json(errorPayload("Database connection error", error));
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
// TEST UPLOAD STATIC
// =====================================================

app.get("/api/uploads-test", (req, res) => {
  if (process.env.NODE_ENV === "production")
    return res.status(404).json({ message: "API route not found" });
  return res.json({
    message: "Uploads static đang hoạt động",

    uploadDirectory,

    avatarDirectory,
  });
});

// =====================================================
// CHATBOT TEST
// =====================================================

app.get("/api/chat/test", (req, res) => {
  if (process.env.NODE_ENV === "production")
    return res.status(404).json({ message: "API route not found" });
  return res.status(200).json({
    message: "Chatbot route đang hoạt động",

    groqConfigured: Boolean(process.env.GROQ_API_KEY),

    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
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

// USERS
app.use("/api/users", userRoutes);

// PAYMENTS
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", loadRouter("./routes/review.routes", "reviewRoutes"));

// CHATBOT AI
app.use("/api/chat", chatRoutes);

// =====================================================
// 404
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

app.use(errorHandler);

// =====================================================
// START SERVER
// =====================================================

const PORT = Number(process.env.PORT) || 5000;

// Vite proxies LAN requests locally; development does not expose the API port.
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";
const httpServer = require("node:http").createServer(app);
require("./services/chatRealtime.service").attachChatRealtime(httpServer, {
  allowedOrigins,
});

async function start() {
  await require("./lib/schema").assertSchemaReady(db);
  require("./controllers/liveChat.controller").startWorker();
  httpServer.listen(PORT, HOST, () => {
    console.log("======================================");

    console.log(`Backend running on port ${PORT}`);

    console.log(`Local: http://localhost:${PORT}`);

    if (HOST === "0.0.0.0") {
      for (const address of lanAddresses) {
        console.log(`LAN: http://${address}:${PORT}`);
      }
    }

    console.log(
      `Frontend: ${process.env.FRONTEND_URL || "http://localhost:5173"}`,
    );

    console.log(`Uploads: http://localhost:${PORT}/uploads`);

    console.log("Allowed CORS origins:", allowedOrigins);

    console.log("--------------------------------------");

    console.log("✅ authRoutes:", typeof authRoutes);

    console.log("✅ flightRoutes:", typeof flightRoutes);

    console.log("✅ seatRoutes:", typeof seatRoutes);

    console.log("✅ bookingRoutes:", typeof bookingRoutes);

    console.log("✅ userRoutes:", typeof userRoutes);

    console.log("✅ paymentRoutes:", typeof paymentRoutes);

    console.log("✅ chatRoutes:", typeof chatRoutes);

    console.log(
      "✅ Groq API:",
      process.env.GROQ_API_KEY ? "Đã cấu hình" : "CHƯA CẤU HÌNH",
    );

    console.log(
      "✅ Groq model:",
      process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    );

    console.log("✅ avatar directory:", avatarDirectory);

    console.log("======================================");
  });
}

start().catch(async (error) => {
  console.error("Backend startup failed:", error.message);
  await db.end();
  process.exitCode = 1;
});
