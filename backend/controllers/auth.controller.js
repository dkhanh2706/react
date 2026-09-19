const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ==========================
// REGISTER
// ==========================

exports.register = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    // kiểm tra email đã tồn tại chưa

    const checkUser = await db.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (checkUser.rows.length > 0) {
      return res.status(400).json({
        message: "Email đã tồn tại",
      });
    }

    // mã hóa password

    const passwordHash = await bcrypt.hash(password, 10);

    // lưu user

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
            ($1,$2,$3,$4)

            RETURNING id, full_name, email, role
            `,

      [full_name, email, passwordHash, phone],
    );

    res.json({
      message: "Đăng ký thành công",

      user: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// ==========================
// LOGIN
// ==========================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // tìm user

    const result = await db.query(
      "SELECT * FROM users WHERE email=$1",

      [email],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Email không tồn tại",
      });
    }

    const user = result.rows[0];

    // kiểm tra password

    const checkPassword = await bcrypt.compare(
      password,

      user.password_hash,
    );

    if (!checkPassword) {
      return res.status(400).json({
        message: "Sai mật khẩu",
      });
    }

    // tạo token

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "1d",
      },
    );

    res.json({
      message: "Đăng nhập thành công",

      token,

      user: {
        id: user.id,

        full_name: user.full_name,

        email: user.email,

        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
};
// ==========================
// FORGOT PASSWORD
// ==========================

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await db.query(
      "SELECT * FROM users WHERE email=$1",

      [email],
    );

    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "Email không tồn tại",
      });
    }

    const account = user.rows[0];

    // tạo mã 6 số

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

    res.json({
      message: "Đã tạo mã reset",

      code: code,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// ==========================
// RESET PASSWORD
// ==========================

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await db.query(
      "SELECT * FROM users WHERE email=$1",

      [email],
    );

    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "Email không tồn tại",
      });
    }

    const account = user.rows[0];

    const reset = await db.query(
      `
        SELECT * FROM password_resets

        WHERE user_id=$1

        AND reset_code=$2

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

    const hash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `
        UPDATE users

        SET password_hash=$1

        WHERE id=$2
        `,

      [hash, account.id],
    );

    await db.query(
      `
        DELETE FROM password_resets

        WHERE user_id=$1
        `,

      [account.id],
    );

    res.json({
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
};
