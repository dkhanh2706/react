// Keep diagnostic details in server logs, never in production responses.
function errorPayload(message, error) {
  return {
    message,
    ...(process.env.NODE_ENV !== "production" && error ? { error: error.message } : {}),
  };
}

function errorHandler(error, req, res, next) {
  console.error("SERVER ERROR:", error);
  if (res.headersSent) return next(error);
  if (error.code === "CORS_BLOCKED") return res.status(403).json(errorPayload("CORS blocked", error));
  if (error.type === "entity.too.large") return res.status(413).json({ message: "Dữ liệu gửi lên vượt quá giới hạn." });
  if (error.type === "entity.parse.failed") return res.status(400).json({ message: "Dữ liệu JSON không hợp lệ." });
  if (error.code === "LIMIT_FILE_SIZE") return res.status(400).json({ message: "Ảnh đại diện không được vượt quá 2MB" });
  if (error.code?.startsWith("LIMIT_")) return res.status(400).json({ message: "Dữ liệu tải lên không hợp lệ." });
  const status = Number(error.status);
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return res.status(status).json({ message: error.message });
  }
  return res.status(500).json(errorPayload("Server error", error));
}

module.exports = { errorPayload, errorHandler };
