const pool = require("../config/database");

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

const endpoint = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    if (error.code === "23505") return res.status(409).json({ message: "Dữ liệu đã tồn tại hoặc ghế vừa được đặt. Vui lòng tải lại." });
    if (error.code === "23503") return res.status(409).json({ message: "Dữ liệu đang được sử dụng, không thể xóa." });
    next(error);
  }
};

async function transaction(work, serializeBookings = true) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Every booking, payment, seat expiry and flight mutation uses the same lock.
    // Serializing these short writes also protects against airplane/seat reassignment.
    if (serializeBookings) await client.query("SELECT pg_advisory_xact_lock($1)", [7241031]);
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function positiveId(value, name = "ID") {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) fail(400, `${name} không hợp lệ`);
  return id;
}

module.exports = { fail, endpoint, transaction, positiveId };
