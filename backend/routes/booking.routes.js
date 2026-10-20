const express = require("express");

const router = express.Router();

const bookingController = require("../controllers/booking.controller");

const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// =====================================================
// HOLD GHẾ
// =====================================================

router.get("/admin", verifyToken, isAdmin, bookingController.getAdminBookings);
router.post("/:bookingId/cancel", verifyToken, isAdmin, bookingController.cancelBooking);

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
