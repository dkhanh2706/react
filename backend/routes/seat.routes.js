const express = require("express");

const router = express.Router();

const seatController = require("../controllers/seat.controller");

// Lấy ghế theo chuyến bay

// VD:
// /api/seats/flight/1

router.get("/flight/:flightId", seatController.getSeatsByFlight);

module.exports = router;
