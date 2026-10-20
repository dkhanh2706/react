const express = require("express");

const router = express.Router();

const flightController = require("../controllers/flight.controller");
const demoFlights = require("../controllers/demoFlights.controller");

const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// =====================================================
// CUSTOMER SEARCH FLIGHT
// =====================================================

// GET
// /api/flights/search
router.get("/search", flightController.searchFlight);
router.get("/catalog", flightController.catalog);
router.get("/overview", verifyToken, isAdmin, flightController.overview);
router.get("/demo/config", verifyToken, isAdmin, demoFlights.config);
router.post("/demo/preview", verifyToken, isAdmin, demoFlights.preview);
router.post("/demo/generate", verifyToken, isAdmin, demoFlights.generate);

// =====================================================
// ADMIN FLIGHT MANAGEMENT
// =====================================================

// GET ALL FLIGHTS
// GET /api/flights
router.get("/", verifyToken, isAdmin, flightController.getAllFlights);

// CREATE FLIGHT
// POST /api/flights
router.post("/", verifyToken, isAdmin, flightController.createFlight);

// UPDATE FLIGHT
// PUT /api/flights/:id
router.put("/:id", verifyToken, isAdmin, flightController.updateFlight);

// DELETE FLIGHT
// DELETE /api/flights/:id
router.delete("/:id", verifyToken, isAdmin, flightController.deleteFlight);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
