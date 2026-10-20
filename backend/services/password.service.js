const crypto = require("crypto");
const bcrypt = require("bcrypt");
const pool = require("../config/database");
const { transaction, fail } = require("../lib/http");
const { sendPasswordCode } = require("./email.service");

function digest(userId, purpose, code) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET chưa được cấu hình");
  return crypto.createHmac("sha256", process.env.JWT_SECRET).update(`${userId}:${purpose}:${code}`).digest("hex");
}

async function requestCode(userId, purpose) {
  const code = crypto.randomInt(100000, 1000000).toString();
  const result = await transaction(async (client) => {
    const user = (await client.query("SELECT id, email, full_name, is_locked FROM users WHERE id=$1 FOR UPDATE", [userId])).rows[0];
    if (!user || user.is_locked) return null;
    const recent = await client.query("SELECT id FROM password_challenges WHERE user_id=$1 AND created_at > now() - interval '60 seconds'", [userId]);
    if (recent.rows.length) fail(429, "Vui lòng đợi 60 giây trước khi yêu cầu mã mới");
    await client.query("UPDATE password_challenges SET consumed_at=now() WHERE user_id=$1 AND consumed_at IS NULL", [userId]);
    const challenge = (await client.query(
      "INSERT INTO password_challenges(user_id,purpose,code_hash,expires_at) VALUES($1,$2,$3,now()+interval '10 minutes') RETURNING id",
      [userId, purpose, digest(userId, purpose, code)],
    )).rows[0];
    return { user, challenge };
  }, false);
  if (!result) return;
  try {
    await sendPasswordCode({ to: result.user.email, fullName: result.user.full_name, code, purpose });
  } catch {
    await pool.query("UPDATE password_challenges SET consumed_at=now() WHERE id=$1", [result.challenge.id]);
    fail(503, "Không gửi được email xác nhận. Vui lòng thử lại sau.");
  }
}

async function resetPassword(userId, purpose, code, password) {
  if (!/^\d{6}$/.test(String(code || ""))) fail(400, "Mã xác nhận phải gồm 6 chữ số");
  if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password) > 72) fail(400, "Mật khẩu phải từ 8 ký tự và không vượt quá 72 byte");
  const result = await transaction(async (client) => {
    const user = (await client.query("SELECT id, password_hash, is_locked FROM users WHERE id=$1 FOR UPDATE", [userId])).rows[0];
    if (!user || user.is_locked) return false;
    const challenge = (await client.query(
      "SELECT * FROM password_challenges WHERE user_id=$1 AND purpose=$2 AND consumed_at IS NULL AND expires_at>now() AND attempts<5 ORDER BY id DESC LIMIT 1 FOR UPDATE",
      [userId, purpose],
    )).rows[0];
    if (!challenge) return false;
    if (!crypto.timingSafeEqual(Buffer.from(challenge.code_hash, "hex"), Buffer.from(digest(userId, purpose, code), "hex"))) {
      await client.query("UPDATE password_challenges SET attempts=attempts+1, consumed_at=CASE WHEN attempts+1>=5 THEN now() ELSE consumed_at END WHERE id=$1", [challenge.id]);
      return false;
    }
    if (await bcrypt.compare(password, user.password_hash)) fail(400, "Mật khẩu mới phải khác mật khẩu hiện tại");
    await client.query("UPDATE users SET password_hash=$1, token_version=token_version+1, updated_at=LOCALTIMESTAMP WHERE id=$2", [await bcrypt.hash(password, 10), userId]);
    await client.query("UPDATE password_challenges SET consumed_at=now() WHERE user_id=$1 AND consumed_at IS NULL", [userId]);
    return true;
  }, false);
  if (!result) fail(400, "Mã xác nhận không hợp lệ, đã hết hạn hoặc tài khoản không khả dụng");
}

module.exports = { requestCode, resetPassword };
