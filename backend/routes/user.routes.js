const express = require("express");

const router = express.Router();

const userController = require("../controllers/user.controller");

const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// =====================================================
// PROFILE CỦA USER ĐANG ĐĂNG NHẬP
// =====================================================

// Lấy hồ sơ hiện tại
router.get("/profile", verifyToken, userController.getMyProfile);

// Cập nhật hồ sơ hiện tại
router.put("/profile", verifyToken, userController.updateMyProfile);

// =====================================================
// ADMIN USER MANAGEMENT
// =====================================================

// lấy tất cả user
router.get("/", verifyToken, isAdmin, userController.getAllUsers);

// lấy user theo id
router.get("/:id", verifyToken, isAdmin, userController.getUserById);

// đổi quyền
router.put("/:id/role", verifyToken, isAdmin, userController.updateRole);

// xóa user
router.delete("/:id", verifyToken, isAdmin, userController.deleteUser);

module.exports = router;
