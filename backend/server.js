const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/database");

const authRoutes = require("./routes/auth.routes");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// =======================
// TEST DATABASE
// =======================

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT current_database();");

    res.json({
      message: "Backend + Database OK",

      database: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

// =======================
// AUTH ROUTES
// =======================

app.use("/api/auth", authRoutes);

// TEST API

app.get("/api/test", (req, res) => {
  res.json({
    message: "API TEST OK",
  });
});

// =======================
// START SERVER
// =======================

app.listen(5000, () => {
  console.log("Server running port 5000");
});
