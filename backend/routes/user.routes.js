const express = require("express");

const router = express.Router();
const rateLimit = require("../middleware/rateLimit");
router.use("/password", rateLimit({ max: 10 }));

const userController = require("../controllers/user.controller");

const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

const uploadAvatar = require("../middleware/uploadAvatar.middleware");

// =====================================================
// PROFILE
// =====================================================

// Lấy profile
router.get("/profile", verifyToken, userController.getMyProfile);

// Cập nhật profile
router.put("/profile", verifyToken, userController.updateMyProfile);

// =====================================================
// AVATAR
// =====================================================

router.post(
  "/profile/avatar",
  verifyToken,
  uploadAvatar.single("avatar"),
  userController.uploadAvatar,
);

// =====================================================
// PASSWORD OTP
// =====================================================

// Tạo mã OTP
router.post(
  "/password/request-code",
  verifyToken,
  userController.requestPasswordChangeCode,
);

// Đổi mật khẩu
router.post(
  "/password/change",
  verifyToken,
  userController.changePasswordWithCode,
);

// =====================================================
// ADMIN
// =====================================================

router.get("/", verifyToken, isAdmin, userController.getAllUsers);

router.get("/:id", verifyToken, isAdmin, userController.getUserById);

router.put("/:id/role", verifyToken, isAdmin, userController.updateRole);

router.put(
  "/:id/toggle-lock",
  verifyToken,
  isAdmin,
  userController.toggleLockUser,
);

router.delete("/:id", verifyToken, isAdmin, userController.deleteUser);

module.exports = router;
