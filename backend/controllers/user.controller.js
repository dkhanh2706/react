const db = require("../config/database");

// ADMIN DUY NHẤT

const MAIN_ADMIN = "adminhdk@gmail.com";

// ==========================
// LẤY DANH SÁCH USER
// ==========================

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      `
            SELECT
                id,
                full_name,
                email,
                phone,
                role
            FROM users
            ORDER BY id ASC
            `,
    );

    res.json(result.rows);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Lỗi lấy danh sách user",

      error: error.message,
    });
  }
};

// ==========================
// LẤY USER THEO ID
// ==========================

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
            SELECT
                id,
                full_name,
                email,
                phone,
                role
            FROM users
            WHERE id=$1
            `,

      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy user",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Lỗi server",

      error: error.message,
    });
  }
};

// ==========================
// ĐỔI QUYỀN USER
// CHỈ CUSTOMER
// ==========================

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;

    const { role } = req.body;

    // Lấy user cần đổi

    const checkUser = await db.query(
      `
            SELECT email
            FROM users
            WHERE id=$1
            `,

      [id],
    );

    if (checkUser.rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy user",
      });
    }

    const email = checkUser.rows[0].email;

    // Không cho đổi admin chính

    if (email === MAIN_ADMIN) {
      return res.status(403).json({
        message: "Không thể thay đổi quyền Admin chính",
      });
    }

    // Không cho tạo thêm ADMIN

    if (role === "ADMIN") {
      return res.status(403).json({
        message: "Hệ thống chỉ có một tài khoản Admin",
      });
    }

    if (role !== "CUSTOMER") {
      return res.status(400).json({
        message: "Role không hợp lệ",
      });
    }

    const result = await db.query(
      `
            UPDATE users

            SET role=$1

            WHERE id=$2

            RETURNING id,full_name,email,role
            `,

      [role, id],
    );

    res.json({
      message: "Cập nhật quyền thành công",

      user: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Lỗi cập nhật quyền",

      error: error.message,
    });
  }
};

// ==========================
// XÓA USER
// ==========================

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const checkUser = await db.query(
      `
            SELECT email
            FROM users
            WHERE id=$1
            `,

      [id],
    );

    if (checkUser.rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy user",
      });
    }

    if (checkUser.rows[0].email === MAIN_ADMIN) {
      return res.status(403).json({
        message: "Không thể xóa tài khoản Admin chính",
      });
    }

    const result = await db.query(
      `
            DELETE FROM users

            WHERE id=$1

            RETURNING id,email
            `,

      [id],
    );

    res.json({
      message: "Xóa tài khoản thành công",

      user: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Không thể xóa user",

      error: error.message,
    });
  }
};
