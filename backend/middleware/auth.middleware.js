const jwt = require("jsonwebtoken");

// ==========================
// KIỂM TRA TOKEN
// ==========================

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Chưa đăng nhập",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token không tồn tại",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({
      message: "Token không hợp lệ",
    });
  }
};

// ==========================
// KIỂM TRA ADMIN
// ==========================

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
