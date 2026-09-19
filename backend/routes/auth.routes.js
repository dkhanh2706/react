const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth.controller");

// đăng ký
router.post("/register", authController.register);

// đăng nhập
router.post("/login", authController.login);

// quên mật khẩu
router.post("/forgot-password", authController.forgotPassword);

// đổi mật khẩu
router.post("/reset-password", authController.resetPassword);

module.exports = router;
