const jwt = require("jsonwebtoken");
const pool = require("../config/database");

// Shared by HTTP and WebSocket authentication; never trust a client-supplied role.
exports.authenticateToken = async token => {
  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
  catch { throw Object.assign(new Error('Phiên đăng nhập không hợp lệ hoặc đã hết hạn'), { status: 401 }); }
  const { rows } = await pool.query('SELECT id,role,is_locked,token_version,is_primary_admin FROM users WHERE id=$1', [decoded.id]);
  const user = rows[0];
  if (!user || user.is_locked || decoded.token_version !== user.token_version) throw Object.assign(new Error('Phiên đăng nhập đã bị thu hồi hoặc tài khoản đã bị khóa'), { status: 401 });
  return user;
};

exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) return res.status(401).json({ message: "Vui lòng đăng nhập" });
  try {
    req.user = await exports.authenticateToken(token);
    next();
  } catch (error) {
    if (error.status === 401) return res.status(401).json({ message: error.message });
    next(error);
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ message: "Bạn không có quyền Admin" });
  next();
};
