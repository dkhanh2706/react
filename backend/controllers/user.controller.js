const db = require("../config/database");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { sendPasswordCode } = require("../services/email.service");

// =====================================================
// ADMIN DUY NHẤT
// =====================================================

const MAIN_ADMIN = "adminhdk@gmail.com";

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
    return "Mật khẩu không được vượt quá 100 ký tự";
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

exports.requestPasswordChangeCode = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản đăng nhập",
      });
    }

    // =============================================
    // USER
    // =============================================

    const userResult = await db.query(
      `
        SELECT
          id,
          full_name,
          email

        FROM users

        WHERE id = $1

        LIMIT 1
      `,
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    const user = userResult.rows[0];

    if (!user.email) {
      return res.status(400).json({
        message: "Tài khoản chưa có email để nhận mã xác nhận",
      });
    }

    // =============================================
    // OTP 6 SỐ
    // =============================================

    const code = crypto.randomInt(100000, 1000000).toString();

    // =============================================
    // XÓA OTP CŨ
    // =============================================

    await db.query(
      `
        DELETE FROM password_resets
        WHERE user_id = $1
      `,
      [userId],
    );

    // =============================================
    // LƯU OTP MỚI
    // =============================================

    await db.query(
      `
        INSERT INTO password_resets
        (
          user_id,
          reset_code,
          expires_at
        )

        VALUES
        (
          $1,
          $2,
          NOW() + INTERVAL '10 minutes'
        )
      `,
      [userId, code],
    );

    // =============================================
    // GỬI OTP QUA GMAIL
    // =============================================

    try {
      await sendPasswordCode({
        to: user.email,
        code,
        fullName: user.full_name || "Quý khách",
        purpose: "change",
      });
    } catch (mailError) {
      console.error("SEND PASSWORD EMAIL ERROR:", mailError);

      // Nếu gửi mail thất bại thì xóa OTP vừa tạo
      await db.query(
        `
          DELETE FROM password_resets
          WHERE user_id = $1
        `,
        [userId],
      );

      return res.status(500).json({
        message: "Không thể gửi mã xác nhận qua email",
        error: mailError.message,
      });
    }

    console.log(`✅ PASSWORD OTP SENT TO: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: "Mã xác nhận đã được gửi đến email của bạn",
      email: user.email,
      expires_in_minutes: 10,
    });
  } catch (error) {
    console.error("REQUEST PASSWORD CODE ERROR:", error);

    return res.status(500).json({
      message: "Không thể gửi mã xác nhận",
      error: error.message,
    });
  }
};

// =====================================================
// ĐỔI MẬT KHẨU BẰNG OTP
// POST /api/users/password/change
// =====================================================

exports.changePasswordWithCode = async (req, res) => {
  const client = await db.connect();

  try {
    const userId = getUserId(req);

    let { code, newPassword, confirmPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được tài khoản đăng nhập",
      });
    }

    code = String(code || "").trim();

    newPassword = String(newPassword || "");

    confirmPassword = String(confirmPassword || "");

    // CODE
    if (!code) {
      return res.status(400).json({
        message: "Vui lòng nhập mã xác nhận",
      });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        message: "Mã xác nhận phải gồm 6 chữ số",
      });
    }

    // PASSWORD
    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return res.status(400).json({
        message: passwordError,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Xác nhận mật khẩu không khớp",
      });
    }

    await client.query("BEGIN");

    // USER
    const userResult = await client.query(
      `
        SELECT
          id,
          password_hash

        FROM users

        WHERE id = $1

        LIMIT 1

        FOR UPDATE
      `,
      [userId],
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    const user = userResult.rows[0];

    // CHECK OTP
    const resetResult = await client.query(
      `
        SELECT
          id,
          reset_code,
          expires_at

        FROM password_resets

        WHERE user_id = $1
          AND reset_code = $2
          AND expires_at > NOW()

        ORDER BY id DESC

        LIMIT 1

        FOR UPDATE
      `,
      [userId, code],
    );

    if (resetResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Mã xác nhận không đúng hoặc đã hết hạn",
      });
    }

    // KHÔNG CHO DÙNG MẬT KHẨU CŨ
    const samePassword = await bcrypt.compare(newPassword, user.password_hash);

    if (samePassword) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Mật khẩu mới phải khác mật khẩu hiện tại",
      });
    }

    // HASH
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // UPDATE PASSWORD
    await client.query(
      `
        UPDATE users

        SET password_hash = $1

        WHERE id = $2
      `,
      [passwordHash, userId],
    );

    // XÓA OTP
    await client.query(
      `
        DELETE FROM password_resets
        WHERE user_id = $1
      `,
      [userId],
    );

    await client.query("COMMIT");

    return res.json({
      message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      //
    }

    console.error("CHANGE PASSWORD ERROR:", error);

    return res.status(500).json({
      message: "Không thể đổi mật khẩu",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// =====================================================
// ADMIN - GET ALL USERS
// =====================================================

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        full_name,
        email,
        phone,
        role,
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

    if (email?.toLowerCase() === MAIN_ADMIN.toLowerCase()) {
      return res.status(403).json({
        message: "Không thể thay đổi quyền Admin chính",
      });
    }

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

    return res.json({
      message: "Cập nhật quyền thành công",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE ROLE ERROR:", error);

    return res.status(500).json({
      message: "Lỗi cập nhật quyền",
      error: error.message,
    });
  }
};

// =====================================================
// ADMIN - DELETE USER
// =====================================================

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const checkUser = await db.query(
      `
        SELECT
          email,
          avatar_url

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

    const target = checkUser.rows[0];

    if (target.email?.toLowerCase() === MAIN_ADMIN.toLowerCase()) {
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

    if (
      target.avatar_url &&
      target.avatar_url.startsWith("/uploads/avatars/")
    ) {
      try {
        const filePath = path.join(
          __dirname,
          "..",
          "uploads",
          "avatars",
          path.basename(target.avatar_url),
        );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error("DELETE USER AVATAR ERROR:", error);
      }
    }

    return res.json({
      message: "Xóa tài khoản thành công",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    return res.status(500).json({
      message: "Không thể xóa user",
      error: error.message,
    });
  }
};

// =====================================================
// ADMIN - LOCK USER
// =====================================================

exports.toggleLockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { is_locked } = req.body;

    const checkUser = await db.query(
      `
        SELECT
          id,
          email,
          role,
          is_locked

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

    const targetUser = checkUser.rows[0];

    if (
      targetUser.role === "ADMIN" ||
      targetUser.email?.toLowerCase() === MAIN_ADMIN.toLowerCase()
    ) {
      return res.status(403).json({
        message: "Không thể khóa tài khoản Quản trị viên",
      });
    }

    const newLockedState =
      is_locked !== undefined ? Boolean(is_locked) : !targetUser.is_locked;

    const result = await db.query(
      `
        UPDATE users

        SET is_locked = $1

        WHERE id = $2

        RETURNING
          id,
          full_name,
          email,
          role,
          created_at,
          is_locked
      `,
      [newLockedState, id],
    );

    return res.json({
      message: newLockedState
        ? "Đã khóa tài khoản thành công"
        : "Đã mở khóa tài khoản thành công",

      user: result.rows[0],
    });
  } catch (error) {
    console.error("TOGGLE LOCK USER ERROR:", error);

    return res.status(500).json({
      message: "Lỗi khi khóa/mở khóa tài khoản",
      error: error.message,
    });
  }
};
