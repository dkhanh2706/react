const express = require("express");

const router = express.Router();

const paymentController = require("../controllers/payment.controller");

const { verifyToken } = require("../middleware/auth.middleware");

// =====================================================
// TẠO THANH TOÁN MOMO
// User phải đăng nhập
// =====================================================

router.post("/momo/create", verifyToken, paymentController.createMomo);

// =====================================================
// MOMO IPN
//
// KHÔNG THÊM verifyToken ở đây.
//
// Vì đây là server MoMo gọi,
// không phải user.
// =====================================================

router.post("/momo/ipn", paymentController.momoIpn);

// =====================================================
// MOMO RETURN
// Dùng để debug/test
// =====================================================

router.get("/momo/return", paymentController.momoReturn);

module.exports = router;
