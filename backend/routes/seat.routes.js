const express = require("express");

const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");

const seatController = require("../controllers/seat.controller");

// Lấy ghế theo chuyến bay

// VD:
// /api/seats/flight/1

router.get("/flight/:flightId", verifyToken, seatController.getSeatsByFlight);

module.exports = router;
