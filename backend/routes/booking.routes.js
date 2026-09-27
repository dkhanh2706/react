const express = require("express");

const router = express.Router();

const bookingController = require("../controllers/booking.controller");

// tạo booking

router.post("/", bookingController.createBooking);

// giữ ghế

router.post("/hold-seat", bookingController.holdSeat);

module.exports = router;
