const { errorPayload } = require("../lib/errors");
const { endpoint, fail } = require("../lib/http");
const passwords = require("../services/password.service");
const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validDate, vietnamToday } = require("../lib/validation");

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
    let { full_name, email, password, phone, birth_date, gender, confirm_password } = req.body;
    full_name = String(full_name || "").trim();
    email = String(email || "")
      .trim()
      .toLowerCase();
    password = String(password || "");
    phone = String(phone || "").trim();

    birth_date = String(birth_date || "");
    gender = String(gender || "");
    const errors = Object.fromEntries(Object.entries({
      full_name: validateFullName(full_name), email: validateEmail(email),
      password: validatePassword(password), phone: validatePhone(phone),
      birth_date: !validDate(birth_date) || birth_date > vietnamToday() ? "Chọn ngày sinh hợp lệ, không lớn hơn hôm nay" : "",
      gender: ["Nam", "Nữ", "Khác"].includes(gender) ? "" : "Vui lòng chọn giới tính",
      confirm_password: !confirm_password || confirm_password !== password ? "Xác nhận mật khẩu phải trùng với mật khẩu" : "",
    }).filter(([, error]) => error));
    if (Object.keys(errors).length) return res.status(400).json({ message: "Vui lòng kiểm tra thông tin đăng ký", errors });

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
        message: "Email đã tồn tại", errors: { email: "Email đã tồn tại" },
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
          phone,
          birth_date,
          gender
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )

        RETURNING
          id,
          full_name,
          email,
          phone,
          TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date,
          gender,
          role
      `,
      [full_name, email, passwordHash, phone, birth_date, gender],
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
        message: "Email đã tồn tại", errors: { email: "Email đã tồn tại" },
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

    return res.status(500).json(errorPayload("Lỗi server khi đăng ký tài khoản", error));
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
        jwtid: require('node:crypto').randomUUID(),
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
        avatar_url: user.avatar_url || null,
        role: user.role,
        is_primary_admin: user.is_primary_admin,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json(errorPayload("Lỗi server khi đăng nhập", error));
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
