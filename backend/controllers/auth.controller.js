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

  if (password.length > 100) {
    return "Mật khẩu không được vượt quá 100 ký tự";
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

    // =====================================================
    // TẠO TOKEN
    // =====================================================

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
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

exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    email = String(email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Vui lòng nhập email",
      });
    }

    const emailError = validateEmail(email);

    if (emailError) {
      return res.status(400).json({
        message: emailError,
      });
    }

    const user = await db.query(
      `
        SELECT *
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [email],
    );

    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "Email không tồn tại",
      });
    }

    const account = user.rows[0];

    // =====================================================
    // TẠO MÃ 6 SỐ
    // =====================================================

    const code = Math.floor(100000 + Math.random() * 900000).toString();

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
      [account.id, code],
    );

    return res.json({
      message: "Đã tạo mã reset",
      code: code,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// ==========================
// RESET PASSWORD
// ==========================

exports.resetPassword = async (req, res) => {
  try {
    let { email, code, newPassword } = req.body;

    email = String(email || "")
      .trim()
      .toLowerCase();

    code = String(code || "").trim();

    newPassword = String(newPassword || "");

    // =====================================================
    // KIỂM TRA ĐẦU VÀO
    // =====================================================

    if (!email) {
      return res.status(400).json({
        message: "Vui lòng nhập email",
      });
    }

    if (!code) {
      return res.status(400).json({
        message: "Vui lòng nhập mã reset",
      });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        message: "Mã reset phải gồm 6 chữ số",
      });
    }

    const emailError = validateEmail(email);

    if (emailError) {
      return res.status(400).json({
        message: emailError,
      });
    }

    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return res.status(400).json({
        message: passwordError,
      });
    }

    // =====================================================
    // TÌM USER
    // =====================================================

    const user = await db.query(
      `
        SELECT *
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [email],
    );

    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "Email không tồn tại",
      });
    }

    const account = user.rows[0];

    // =====================================================
    // KIỂM TRA RESET CODE
    // =====================================================

    const reset = await db.query(
      `
        SELECT *
        FROM password_resets

        WHERE user_id = $1
          AND reset_code = $2
          AND expires_at > NOW()

        ORDER BY id DESC

        LIMIT 1
      `,
      [account.id, code],
    );

    if (reset.rows.length === 0) {
      return res.status(400).json({
        message: "Mã reset không đúng hoặc hết hạn",
      });
    }

    // =====================================================
    // HASH MẬT KHẨU MỚI
    // =====================================================

    const hash = await bcrypt.hash(newPassword, 10);

    // =====================================================
    // CẬP NHẬT PASSWORD
    // =====================================================

    await db.query(
      `
        UPDATE users

        SET password_hash = $1

        WHERE id = $2
      `,
      [hash, account.id],
    );

    // =====================================================
    // XÓA RESET CODE SAU KHI DÙNG
    // =====================================================

    await db.query(
      `
        DELETE FROM password_resets
        WHERE user_id = $1
      `,
      [account.id],
    );

    return res.json({
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};
