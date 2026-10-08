const express = require("express");

const router = express.Router();

const bookingController = require("../controllers/booking.controller");

const { verifyToken } = require("../middleware/auth.middleware");

// =====================================================
// HOLD GHẾ
// =====================================================

router.post("/hold-seat", verifyToken, bookingController.holdSeat);

// =====================================================
// TẠO BOOKING
// =====================================================

router.post("/", verifyToken, bookingController.createBooking);

// =====================================================
// THANH TOÁN GIẢ LẬP
// =====================================================

router.post("/:bookingId/pay", verifyToken, bookingController.confirmPayment);

// =====================================================
// VÉ CỦA TÔI
// =====================================================

router.get("/my-tickets", verifyToken, bookingController.getMyTickets);

module.exports = router;
