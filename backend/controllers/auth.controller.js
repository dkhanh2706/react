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
