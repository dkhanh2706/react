const router = require("express").Router();
const pool = require("../config/database");
const { endpoint, fail, transaction, positiveId } = require("../lib/http");
const { verifyToken } = require("../middleware/auth.middleware");
const { MAX_REVIEWS } = require("../config/reviews");

// Keep existing booking/payment routes available before migration 006 is applied.
router.use(async (req, res, next) => {
  const { rows } = await pool.query("SELECT to_regclass('public.customer_reviews') AS table_name");
  if (!rows[0].table_name) return res.status(503).json({ message: "Tính năng đánh giá chưa sẵn sàng. Cần áp dụng migration 006_customer_reviews.sql." });
  next();
});

router.get("/", endpoint(async (req, res) => {
  const { rows } = await pool.query(`SELECT r.id,r.rating,r.comment,r.created_at,
    u.full_name AS name,b.departure_place,b.arrival_place
    FROM customer_reviews r JOIN bookings b ON b.id=r.booking_id JOIN users u ON u.id=b.user_id
    ORDER BY r.created_at DESC,r.id DESC LIMIT $1`, [MAX_REVIEWS]);
  res.json({ data: rows });
}));

router.get("/mine", verifyToken, endpoint(async (req, res) => {
  const { rows } = await pool.query(`SELECT b.id AS booking_id,b.customer_reviewed_at,
    r.id,r.rating,r.comment FROM bookings b LEFT JOIN customer_reviews r ON r.booking_id=b.id
    WHERE b.user_id=$1 AND b.customer_reviewed_at IS NOT NULL`, [req.user.id]);
  res.json({ data: rows });
}));

router.post("/:bookingId", verifyToken, endpoint(async (req, res) => {
  const bookingId = positiveId(req.params.bookingId);
  const { rating, comment } = req.body;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fail(400, "Vui lòng chọn từ 1 đến 5 sao");
  if (typeof comment !== "string" || !comment.trim() || comment.trim().length > 1000) fail(400, "Nội dung đánh giá cần từ 1 đến 1000 ký tự");
  const data = await transaction(async client => {
    const booking = (await client.query("SELECT * FROM bookings WHERE id=$1 AND user_id=$2 FOR UPDATE", [bookingId,req.user.id])).rows[0];
    if (!booking) fail(404, "Không tìm thấy vé của bạn");
    if (booking.customer_reviewed_at) fail(409, "Mỗi đơn vé chỉ được đánh giá một lần, kể cả khi đánh giá đã bị xóa");
    const paid = await client.query(`SELECT p.id FROM payments p WHERE p.booking_id=$1 AND p.status='SUCCESS'
      AND NOT EXISTS(SELECT FROM payment_review_cases r WHERE r.payment_id=p.id AND r.status='OPEN')`, [bookingId]);
    if (booking.status !== "CONFIRMED" || !paid.rowCount) fail(409, "Chỉ được đánh giá vé đã thanh toán và xác nhận thành công");
    const review = (await client.query("INSERT INTO customer_reviews(booking_id,rating,comment) VALUES($1,$2,$3) RETURNING *", [bookingId,rating,comment.trim()])).rows[0];
    await client.query("UPDATE bookings SET customer_reviewed_at=$1 WHERE id=$2", [review.created_at,bookingId]);
    // Serialized with every review/booking write: concurrent submissions keep exactly the newest N.
    await client.query(`DELETE FROM customer_reviews WHERE id IN (
      SELECT id FROM customer_reviews ORDER BY created_at DESC,id DESC OFFSET $1)`, [MAX_REVIEWS]);
    return review;
  });
  res.status(201).json({ data });
}));

router.delete("/:reviewId", verifyToken, endpoint(async (req, res) => {
  const id = positiveId(req.params.reviewId);
  await transaction(async client => {
    const result = await client.query(`DELETE FROM customer_reviews r USING bookings b
      WHERE r.id=$1 AND b.id=r.booking_id AND b.user_id=$2 RETURNING r.id`, [id,req.user.id]);
    if (!result.rowCount) fail(404, "Đánh giá không tồn tại hoặc không thuộc tài khoản của bạn");
  });
  res.json({ message: "Đã xóa đánh giá vĩnh viễn" });
}));

module.exports = router;
