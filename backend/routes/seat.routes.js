const express = require("express");

const router = express.Router();

const seatController = require("../controllers/seat.controller");

// Lấy danh sách ghế theo máy bay
// VD:
// /api/seats/airplane/1

router.get("/airplane/:airplaneId", seatController.getSeatsByAirplane);

// Lấy ghế đã đặt theo chuyến bay
// VD:
// /api/seats/booked/1

router.get("/booked/:flightId", seatController.getBookedSeats);

module.exports = router;
