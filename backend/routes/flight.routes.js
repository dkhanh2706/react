const express = require("express");

const router = express.Router();

const flightController = require("../controllers/flight.controller");

const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// =====================================
// CUSTOMER SEARCH FLIGHT
// =====================================

// tìm chuyến bay
router.get("/search", flightController.searchFlight);

// =====================================
// ADMIN FLIGHT MANAGEMENT
// =====================================

// lấy tất cả chuyến bay

router.get("/", verifyToken, isAdmin, flightController.getAllFlights);

// thêm chuyến bay

router.post("/", verifyToken, isAdmin, flightController.createFlight);

// cập nhật chuyến bay

router.put("/:id", verifyToken, isAdmin, flightController.updateFlight);

// xóa chuyến bay

router.delete("/:id", verifyToken, isAdmin, flightController.deleteFlight);

module.exports = router;
