const db = require("../config/database");

// =====================================================
// ADMIN DUY NHẤT
// =====================================================

const MAIN_ADMIN = "adminhdk@gmail.com";

// =====================================================
// VALIDATE PROFILE
// =====================================================

const validateFullName = (value) => {
  const fullName = String(value || "").trim();

  if (!fullName) {
    return "Vui lòng nhập họ và tên";
  }

  if (fullName.length < 2) {
    return "Họ và tên phải có ít nhất 2 ký tự";
  }

  if (fullName.length > 100) {
    return "Họ và tên không được vượt quá 100 ký tự";
  }

  const nameRegex = /^[\p{L}\s'.-]+$/u;

  if (!nameRegex.test(fullName)) {
    return "Họ và tên không hợp lệ";
  }

  return "";
};

const validatePhone = (value) => {
  const phone = String(value || "").trim();

  if (!phone) {
    return "Vui lòng nhập số điện thoại";
  }

  if (!/^0\d{9}$/.test(phone)) {
    return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0";
  }

  return "";
};

const normalizeGender = (value) => {
  if (!value) {
    return null;
  }

  const gender = String(value).trim().toLowerCase();

  if (gender === "nam" || gender === "male") {
    return "Nam";
  }

  if (gender === "nữ" || gender === "nu" || gender === "female") {
    return "Nữ";
  }

  if (gender === "khác" || gender === "khac" || gender === "other") {
    return "Khác";
  }

  return null;
};

const validateBirthDate = (value) => {
  if (!value) {
    return "";
  }

  const birthDate = String(value).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return "Ngày sinh không đúng định dạng";
  }

  const date = new Date(`${birthDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Ngày sinh không hợp lệ";
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (date > today) {
    return "Ngày sinh không được lớn hơn ngày hiện tại";
  }

  return "";
};

// =====================================================
// LẤY HỒ SƠ CỦA USER ĐANG ĐĂNG NHẬP
// GET /api/users/profile
// =====================================================

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản đăng nhập",
      });
    }

    const result = await db.query(
      `
        SELECT
          id,
          full_name,
          email,
          phone,
          TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date,
          gender,
          role,
          created_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    return res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      message: "Không thể tải hồ sơ cá nhân",
      error: error.message,
    });
  }
};

// =====================================================
// CẬP NHẬT HỒ SƠ CỦA USER ĐANG ĐĂNG NHẬP
// PUT /api/users/profile
// EMAIL KHÔNG ĐƯỢC THAY ĐỔI
// =====================================================

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản đăng nhập",
      });
    }

    let { full_name, phone, birth_date, gender } = req.body;

    full_name = String(full_name || "").trim();
    phone = String(phone || "").trim();

    birth_date = birth_date ? String(birth_date).trim() : null;

    // =================================================
    // VALIDATE HỌ TÊN
    // =================================================

    const fullNameError = validateFullName(full_name);

    if (fullNameError) {
      return res.status(400).json({
        message: fullNameError,
      });
    }

    // =================================================
    // VALIDATE SĐT
    // =================================================

    const phoneError = validatePhone(phone);

    if (phoneError) {
      return res.status(400).json({
        message: phoneError,
      });
    }

    // =================================================
    // VALIDATE NGÀY SINH
    // =================================================

    const birthDateError = validateBirthDate(birth_date);

    if (birthDateError) {
      return res.status(400).json({
        message: birthDateError,
      });
    }

    // =================================================
    // VALIDATE GIỚI TÍNH
    // =================================================

    let normalizedGender = null;

    if (gender) {
      normalizedGender = normalizeGender(gender);

      if (!normalizedGender) {
        return res.status(400).json({
          message: "Giới tính chỉ được chọn Nam, Nữ hoặc Khác",
        });
      }
    }

    // =================================================
    // UPDATE DATABASE
    // EMAIL KHÔNG CÓ TRONG CÂU UPDATE
    // =================================================

    const result = await db.query(
      `
        UPDATE users

        SET
          full_name = $1,
          phone = $2,
          birth_date = $3,
          gender = $4

        WHERE id = $5

        RETURNING
          id,
          full_name,
          email,
          phone,
          TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date,
          gender,
          role,
          created_at
      `,
      [full_name, phone, birth_date, normalizedGender, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    return res.json({
      message: "Cập nhật thông tin thành công",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return res.status(500).json({
      message: "Không thể cập nhật hồ sơ",
      error: error.message,
    });
  }
};

// =====================================================
// ADMIN - LẤY DANH SÁCH USER
// =====================================================

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

// =====================================================
// ADMIN - LẤY USER THEO ID
// =====================================================

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
        WHERE id = $1
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

// =====================================================
// ADMIN - ĐỔI QUYỀN USER
// =====================================================

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const checkUser = await db.query(
      `
        SELECT email
        FROM users
        WHERE id = $1
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
    if (email?.toLowerCase() === MAIN_ADMIN.toLowerCase()) {
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

        SET role = $1

        WHERE id = $2

        RETURNING
          id,
          full_name,
          email,
          role
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

// =====================================================
// ADMIN - XÓA USER
// =====================================================

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const checkUser = await db.query(
      `
        SELECT email
        FROM users
        WHERE id = $1
      `,
      [id],
    );

    if (checkUser.rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy user",
      });
    }

    if (checkUser.rows[0].email?.toLowerCase() === MAIN_ADMIN.toLowerCase()) {
      return res.status(403).json({
        message: "Không thể xóa tài khoản Admin chính",
      });
    }

    const result = await db.query(
      `
        DELETE FROM users

        WHERE id = $1

        RETURNING
          id,
          email
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
