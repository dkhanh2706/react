const jwt = require("jsonwebtoken");

// =====================================================
// KIỂM TRA TOKEN
// =====================================================

exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Không có Authorization header
    if (!authHeader) {
      return res.status(401).json({
        message: "Chưa đăng nhập",
      });
    }

    // Header phải có dạng:
    // Authorization: Bearer <token>
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Token không đúng định dạng",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token không tồn tại",
      });
    }

    // Kiểm tra JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("JWT ERROR: JWT_SECRET chưa được cấu hình trong .env");

      return res.status(500).json({
        message: "Lỗi cấu hình xác thực phía server",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Gắn user đã decode vào request
    req.user = decoded;

    next();
  } catch (error) {
    console.error("JWT VERIFY ERROR:", {
      name: error.name,
      message: error.message,
    });

    // =====================================================
    // TOKEN HẾT HẠN
    // =====================================================

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Phiên đăng nhập đã hết hạn",
        code: "TOKEN_EXPIRED",
      });
    }

    // =====================================================
    // TOKEN KHÔNG HỢP LỆ
    // =====================================================

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        message: "Token không hợp lệ",
        code: "INVALID_TOKEN",
      });
    }

    // =====================================================
    // TOKEN CHƯA CÓ HIỆU LỰC
    // =====================================================

    if (error.name === "NotBeforeError") {
      return res.status(403).json({
        message: "Token chưa có hiệu lực",
        code: "TOKEN_NOT_ACTIVE",
      });
    }

    // =====================================================
    // LỖI KHÁC
    // =====================================================

    return res.status(403).json({
      message: "Không thể xác thực tài khoản",
      code: "AUTH_ERROR",
    });
  }
};

// =====================================================
// KIỂM TRA ADMIN
// =====================================================

exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Chưa xác thực",
    });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      message: "Bạn không có quyền Admin",
    });
  }

  next();
};
