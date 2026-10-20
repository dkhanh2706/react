const jwt = require("jsonwebtoken");
const pool = require("../config/database");

exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) return res.status(401).json({ message: "Vui lòng đăng nhập" });
  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
  catch { return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" }); }
  try {
    const { rows } = await pool.query("SELECT id, role, is_locked, token_version, is_primary_admin FROM users WHERE id=$1", [decoded.id]);
    const user = rows[0];
    if (!user || user.is_locked || decoded.token_version !== user.token_version) {
      return res.status(401).json({ message: "Phiên đăng nhập đã bị thu hồi hoặc tài khoản đã bị khóa" });
    }
    req.user = user;
    next();
  } catch (error) { next(error); }
};

exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ message: "Bạn không có quyền Admin" });
  next();
};
