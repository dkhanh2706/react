const { endpoint, fail, transaction, positiveId } = require("../lib/http");
const passwords = require("../services/password.service");
const db = require("../config/database");
const fs = require("fs");
const path = require("path");


// =====================================================
// ADMIN DUY NHẤT
// =====================================================


// =====================================================
// GET USER ID
// =====================================================

const getUserId = (req) => {
  return req.user?.id || req.user?.user_id || req.user?.userId || null;
};

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

// =====================================================
// PHONE
// =====================================================

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

// =====================================================
// GENDER
// =====================================================

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

// =====================================================
// BIRTH DATE
// =====================================================

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
// PASSWORD
// =====================================================

const validatePassword = (value) => {
  const password = String(value || "");

  if (!password) {
    return "Vui lòng nhập mật khẩu mới";
  }

  if (password.length < 8) {
    return "Mật khẩu phải có ít nhất 8 ký tự";
  }

  if (password.length > 100) {
    return "Mật khẩu không được vượt quá 72 byte";
  }

  return "";
};

// =====================================================
// GET PROFILE
// GET /api/users/profile
// =====================================================

exports.getMyProfile = async (req, res) => {
  try {
    const userId = getUserId(req);

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

          TO_CHAR(
            birth_date,
            'YYYY-MM-DD'
          ) AS birth_date,

          gender,
          role,
          is_primary_admin,
          avatar_url,
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
// UPDATE PROFILE
// PUT /api/users/profile
// =====================================================

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản đăng nhập",
      });
    }

    let { full_name, phone, birth_date, gender } = req.body;

    full_name = String(full_name || "").trim();
    phone = String(phone || "").trim();
    birth_date = birth_date ? String(birth_date).trim() : null;

    // NAME
    const fullNameError = validateFullName(full_name);

    if (fullNameError) {
      return res.status(400).json({
        message: fullNameError,
      });
    }

    // PHONE
    const phoneError = validatePhone(phone);

    if (phoneError) {
      return res.status(400).json({
        message: phoneError,
      });
    }

    // BIRTH
    const birthDateError = validateBirthDate(birth_date);

    if (birthDateError) {
      return res.status(400).json({
        message: birthDateError,
      });
    }

    // GENDER
    let normalizedGender = null;

    if (gender) {
      normalizedGender = normalizeGender(gender);

      if (!normalizedGender) {
        return res.status(400).json({
          message: "Giới tính chỉ được chọn Nam, Nữ hoặc Khác",
        });
      }
    }

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

          TO_CHAR(
            birth_date,
            'YYYY-MM-DD'
          ) AS birth_date,

          gender,
          role,
          is_primary_admin,
          avatar_url,
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
// UPLOAD AVATAR
// POST /api/users/profile/avatar
// =====================================================

exports.uploadAvatar = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản đăng nhập",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Vui lòng chọn ảnh đại diện",
      });
    }

    const oldUserResult = await db.query(
      `
        SELECT avatar_url
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId],
    );

    if (oldUserResult.rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    const oldAvatar = oldUserResult.rows[0].avatar_url;

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const result = await db.query(
      `
        UPDATE users

        SET avatar_url = $1

        WHERE id = $2

        RETURNING
          id,
          full_name,
          email,
          phone,

          TO_CHAR(
            birth_date,
            'YYYY-MM-DD'
          ) AS birth_date,

          gender,
          role,
          is_primary_admin,
          avatar_url,
          created_at
      `,
      [avatarUrl, userId],
    );

    if (oldAvatar && oldAvatar.startsWith("/uploads/avatars/")) {
      try {
        const oldFilename = path.basename(oldAvatar);

        const oldFilePath = path.join(
          __dirname,
          "..",
          "uploads",
          "avatars",
          oldFilename,
        );

        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (deleteError) {
        console.error("DELETE OLD AVATAR ERROR:", deleteError);
      }
    }

    return res.status(200).json({
      message: "Cập nhật ảnh đại diện thành công",
      user: result.rows[0],
      avatar_url: avatarUrl,
    });
  } catch (error) {
    console.error("UPLOAD AVATAR ERROR:", error);

    return res.status(500).json({
      message: "Không thể cập nhật ảnh đại diện",
      error: error.message,
    });
  }
};

// =====================================================
// GỬI MÃ ĐỔI MẬT KHẨU
// POST /api/users/password/request-code
// =====================================================

exports.requestPasswordChangeCode = endpoint(async (req, res) => {
  await passwords.requestCode(getUserId(req), "change");
  res.json({ message: "Mã xác nhận đã được gửi qua email", expires_in_minutes: 10 });
});
exports.changePasswordWithCode = endpoint(async (req, res) => {
  if (req.body.newPassword !== req.body.confirmPassword) fail(400, "Xác nhận mật khẩu không khớp");
  await passwords.resetPassword(getUserId(req), "change", req.body.code, req.body.newPassword);
  res.json({ message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại." });
});

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        full_name,
        email,
        phone,
        role,
        is_primary_admin,
        avatar_url,
        created_at,
        COALESCE(
          is_locked,
          FALSE
        ) AS is_locked

      FROM users

      ORDER BY id ASC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    return res.status(500).json({
      message: "Lỗi lấy danh sách user",
      error: error.message,
    });
  }
};

// =====================================================
// ADMIN - GET USER ID
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
          role,
          is_primary_admin,
          avatar_url

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

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("GET USER ERROR:", error);

    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// =====================================================
// ADMIN - UPDATE ROLE
// =====================================================

exports.updateRole = endpoint(async (req, res) => {
  const id = positiveId(req.params.id);
  if (req.body.role !== "CUSTOMER") fail(400, "Chỉ hỗ trợ quyền CUSTOMER; admin chính được bảo vệ");
  const user = await transaction(async (client) => {
    const target = (await client.query("SELECT * FROM users WHERE id=$1 FOR UPDATE", [id])).rows[0];
    if (!target) fail(404, "Không tìm thấy tài khoản");
    if (target.is_primary_admin || target.id === req.user.id) fail(403, "Không thể thay đổi quyền tài khoản này");
    return (await client.query("UPDATE users SET role=$1, token_version=token_version+1 WHERE id=$2 RETURNING id, full_name, email, role", [req.body.role, id])).rows[0];
  }, false);
  res.json({ message: "Cập nhật quyền thành công", user });
});

exports.toggleLockUser = endpoint(async (req, res) => {
  const id = positiveId(req.params.id);
  if (req.body.is_locked !== undefined && typeof req.body.is_locked !== "boolean") fail(400, "Trạng thái khóa không hợp lệ");
  const user = await transaction(async (client) => {
    const target = (await client.query("SELECT * FROM users WHERE id=$1 FOR UPDATE", [id])).rows[0];
    if (!target) fail(404, "Không tìm thấy tài khoản");
    if (target.is_primary_admin || target.role === "ADMIN" || id === req.user.id) fail(403, "Không thể khóa tài khoản Admin");
    const locked = req.body.is_locked ?? !target.is_locked;
    return (await client.query("UPDATE users SET is_locked=$1, token_version=token_version+1 WHERE id=$2 RETURNING id, full_name, email, role, created_at, is_locked", [locked, id])).rows[0];
  }, false);
  res.json({ message: user.is_locked ? "Đã khóa tài khoản và thu hồi phiên đăng nhập" : "Đã mở khóa tài khoản", user });
});

exports.deleteUser = endpoint(async (req, res) => {
  const id = positiveId(req.params.id);
  await transaction(async (client) => {
    const target = (await client.query("SELECT * FROM users WHERE id=$1 FOR UPDATE", [id])).rows[0];
    if (!target) fail(404, "Không tìm thấy tài khoản");
    if (target.is_primary_admin || target.role === "ADMIN" || id === req.user.id) fail(403, "Không thể xóa tài khoản Admin");
    const related = await client.query(`SELECT EXISTS(SELECT FROM bookings WHERE user_id=$1)
      OR EXISTS(SELECT FROM notifications WHERE user_id=$1)
      OR EXISTS(SELECT FROM password_challenges WHERE user_id=$1)
      OR EXISTS(SELECT FROM payment_review_cases WHERE resolved_by=$1) AS found`, [id]);
    if (related.rows[0].found) fail(409, "Tài khoản có lịch sử liên quan. Hãy dùng chức năng khóa để bảo toàn dữ liệu.");
    await client.query("DELETE FROM users WHERE id=$1", [id]);
  }, false);
  res.json({ message: "Đã xóa tài khoản chưa có dữ liệu liên quan" });
});
