const { endpoint, fail } = require("../lib/http");
const passwords = require("../services/password.service");
const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// =====================================================
// HÀM VALIDATE DÙNG CHUNG
// =====================================================

// -----------------------------------------------------
// EMAIL
// -----------------------------------------------------
function validateEmail(emailValue) {
  const email = String(emailValue || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return "Vui lòng nhập email";
  }

  if (email.length > 150) {
    return "Email không được vượt quá 150 ký tự";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,24}$/;

  if (!emailRegex.test(email)) {
    return "Email không đúng định dạng";
  }

  // Một số lỗi gõ domain phổ biến
  const commonWrongDomains = [
    "gmail.con",
    "gmai.com",
    "gmial.com",
    "gmail.co",
    "yahoo.con",
    "outlook.con",
  ];

  const domain = email.split("@")[1];

  if (commonWrongDomains.includes(domain)) {
    return "Tên miền email không hợp lệ";
  }

  return "";
}

// -----------------------------------------------------
// HỌ TÊN
// -----------------------------------------------------
function validateFullName(fullNameValue) {
  const fullName = String(fullNameValue || "").trim();

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
    return "Họ và tên không được chứa số hoặc ký tự đặc biệt không hợp lệ";
  }

  return "";
}

// -----------------------------------------------------
// PASSWORD
// -----------------------------------------------------
function validatePassword(passwordValue) {
  const password = String(passwordValue || "");

  if (!password) {
    return "Vui lòng nhập mật khẩu";
  }

  if (password.length < 8) {
    return "Mật khẩu phải có ít nhất 8 ký tự";
  }

  if (Buffer.byteLength(password) > 72) {
    return "Mật khẩu không được vượt quá 72 byte";
  }

  return "";
}

// -----------------------------------------------------
// PHONE
// -----------------------------------------------------
function validatePhone(phoneValue) {
  const phone = String(phoneValue || "").trim();

  if (!phone) {
    return "Vui lòng nhập số điện thoại";
  }

  // SĐT Việt Nam cơ bản:
  // bắt đầu bằng 0 và đủ 10 chữ số
  const phoneRegex = /^0\d{9}$/;

  if (!phoneRegex.test(phone)) {
    return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0";
  }

  return "";
}

// ==========================
// REGISTER
// ==========================

exports.register = async (req, res) => {
  try {
    let { full_name, email, password, phone } = req.body;
    full_name = String(full_name || "").trim();
    email = String(email || "")
      .trim()
      .toLowerCase();
    password = String(password || "");
    phone = String(phone || "").trim();

    const fullNameError = validateFullName(full_name);

    if (fullNameError) {
      return res.status(400).json({
        message: fullNameError,
      });
    }

    const emailError = validateEmail(email);

    if (emailError) {
      return res.status(400).json({
        message: emailError,
      });
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      return res.status(400).json({
        message: passwordError,
      });
    }

    const phoneError = validatePhone(phone);

    if (phoneError) {
      return res.status(400).json({
        message: phoneError,
      });
    }

    // =====================================================
    // KIỂM TRA EMAIL ĐÃ TỒN TẠI
    // =====================================================

    const checkUser = await db.query(
      `
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [email],
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({
        message: "Email đã tồn tại",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // =====================================================
    // LƯU USER
    // =====================================================

    const result = await db.query(
      `
        INSERT INTO users
        (
          full_name,
          email,
          password_hash,
          phone
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4
        )

        RETURNING
          id,
          full_name,
          email,
          phone,
          role
      `,
      [full_name, email, passwordHash, phone],
    );

    return res.status(201).json({
      message: "Đăng ký thành công",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    // =====================================================
    // EMAIL UNIQUE TRONG DATABASE
    // =====================================================

    if (error.code === "23505") {
      return res.status(400).json({
        message: "Email đã tồn tại",
      });
    }

    // =====================================================
    // DỮ LIỆU VƯỢT ĐỘ DÀI VARCHAR
    // PostgreSQL: value too long
    // =====================================================

    if (error.code === "22001") {
      return res.status(400).json({
        message: "Dữ liệu nhập vào vượt quá độ dài cho phép",
      });
    }

    // =====================================================
    // NOT NULL
    // =====================================================

    if (error.code === "23502") {
      return res.status(400).json({
        message: "Thiếu dữ liệu bắt buộc",
      });
    }

    return res.status(500).json({
      message: "Lỗi server khi đăng ký tài khoản",
      error: error.message,
    });
  }
};

// ==========================
// LOGIN
// ==========================

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = String(email || "")
      .trim()
      .toLowerCase();

    password = String(password || "");

    if (!email) {
      return res.status(400).json({
        message: "Vui lòng nhập email",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Vui lòng nhập mật khẩu",
      });
    }

    const emailError = validateEmail(email);

    if (emailError) {
      return res.status(400).json({
        message: emailError,
      });
    }

    // =====================================================
    // TÌM USER
    // =====================================================

    const result = await db.query(
      `
        SELECT *
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Email không tồn tại",
      });
    }

    const user = result.rows[0];

    const checkPassword = await bcrypt.compare(password, user.password_hash);

    if (!checkPassword) {
      return res.status(400).json({
        message: "Sai mật khẩu",
      });
    }

    if (user.is_locked) {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị khóa bởi Quản trị viên",
      });
    }

    // =====================================================
    // TẠO TOKEN
    // =====================================================

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        token_version: user.token_version,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      },
    );

    return res.json({
      message: "Đăng nhập thành công",

      token,

      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || "",
        birth_date: user.birth_date || null,
        gender: user.gender || null,
        role: user.role,
        is_primary_admin: user.is_primary_admin,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Lỗi server khi đăng nhập",
      error: error.message,
    });
  }
};

// ==========================
// FORGOT PASSWORD
// ==========================

exports.forgotPassword = endpoint(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const error = validateEmail(email);
  if (error) fail(400, error);
  const user = (await db.query("SELECT id FROM users WHERE LOWER(email)=$1 AND NOT COALESCE(is_locked,false)", [email])).rows[0];
  if (user) await passwords.requestCode(user.id, "forgot");
  res.json({ message: "Nếu tài khoản hợp lệ, mã khôi phục sẽ được gửi qua email." });
});

exports.resetPassword = endpoint(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = (await db.query("SELECT id FROM users WHERE LOWER(email)=$1", [email])).rows[0];
  if (!user) fail(400, "Mã xác nhận hoặc tài khoản không hợp lệ");
  await passwords.resetPassword(user.id, "forgot", req.body.code, req.body.newPassword);
  res.json({ message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại." });
});
