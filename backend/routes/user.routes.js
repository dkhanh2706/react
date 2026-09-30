const express = require("express");

const router = express.Router();

const userController = require("../controllers/user.controller");

const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// ==========================
// ADMIN USER MANAGEMENT
// ==========================

// lấy tất cả user

router.get(
  "/",

  verifyToken,

  isAdmin,

  userController.getAllUsers,
);

// lấy user theo id

router.get(
  "/:id",

  verifyToken,

  isAdmin,

  userController.getUserById,
);

// đổi quyền

router.put(
  "/:id/role",

  verifyToken,

  isAdmin,

  userController.updateRole,
);

// xóa user

router.delete(
  "/:id",

  verifyToken,

  isAdmin,

  userController.deleteUser,
);

module.exports = router;
