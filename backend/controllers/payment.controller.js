const crypto = require("crypto");
const pool = require("../config/database");
const { endpoint, fail, transaction, positiveId } = require("../lib/http");
const flow = require("../services/booking.service");
const momo = require("../services/momo.service");
const { sendPaymentEmailSafely } = require("../services/receipt.service");

exports.config = endpoint(async (req, res) => res.json({ demo_payments_enabled: flow.demoEnabled() }));

exports.createMomo = endpoint(async (req, res) => {
  const bookingId = positiveId(req.body.booking_id || req.body.bookingId);
  const attempt = await transaction(async (client) => {
    await flow.expireHolds(client);
    const loaded = await flow.loadBooking(client, bookingId, req.user.id);
    await flow.requirePayable(client, loaded);
    const pending = (await client.query("SELECT * FROM payments WHERE booking_id=$1 AND method='MOMO' AND status='PENDING' AND momo_order_id IS NOT NULL ORDER BY id DESC LIMIT 1", [bookingId])).rows[0];
    if (pending?.pay_url) return { ...pending, reuse: true };
    if (pending && Date.now() - new Date(pending.created_at).getTime() < 30000) fail(409, "Đang tạo giao dịch, vui lòng đợi rồi thử lại");
    const orderId = `BK_${bookingId}_${crypto.randomUUID()}`;
    const requestId = `REQ_${crypto.randomUUID()}`;
    return (await client.query(`INSERT INTO payments(booking_id,method,amount,status,momo_order_id,momo_request_id)
      VALUES($1,'MOMO',$2,'PENDING',$3,$4) RETURNING *`, [bookingId, loaded.booking.total_price, orderId, requestId])).rows[0];
  });
  if (attempt.reuse) return res.json({ booking_id: bookingId, orderId: attempt.momo_order_id, requestId: attempt.momo_request_id, payUrl: attempt.pay_url });
  let result;
  try {
    result = await momo.createMomoPayment({ bookingId, amount: Number(attempt.amount), orderInfo: `Thanh toan ve ${bookingId}`, orderId: attempt.momo_order_id, requestId: attempt.momo_request_id });
    if (!result.payUrl) throw new Error("Không nhận được đường dẫn MoMo");
    await pool.query("UPDATE payments SET pay_url=$1 WHERE id=$2", [result.payUrl, attempt.id]);
  } catch (error) {
    await pool.query("UPDATE payments SET status='FAILED',provider_message=$1 WHERE id=$2 AND status='PENDING'", [String(error.message).slice(0,1000), attempt.id]);
    fail(502, "Không thể tạo thanh toán MoMo. Vui lòng thử lại.");
  }
  res.json({ booking_id: bookingId, orderId: attempt.momo_order_id, requestId: attempt.momo_request_id, payUrl: result.payUrl });
});

exports.momoIpn = endpoint(async (req, res) => {
  const body = req.body;
  if (!momo.verifyMomoIpnSignature(body)) fail(400, "Invalid signature");
  let extra;
  try { extra = momo.decodeExtraData(body.extraData); } catch { fail(400, "Invalid extraData"); }
  const bookingId = positiveId(extra.bookingId);
  const resultCode = Number(body.resultCode);
  if (!Number.isInteger(resultCode)) fail(400, "Invalid result code");
  const result = await transaction(async (client) => {
    await flow.expireHolds(client);
    const loaded = await flow.loadBooking(client, bookingId);
    const payment = (await client.query("SELECT * FROM payments WHERE momo_order_id=$1 AND momo_request_id=$2 AND booking_id=$3 AND method='MOMO' FOR UPDATE", [body.orderId, body.requestId, bookingId])).rows[0];
    if (!payment || Number(payment.amount) !== Number(body.amount) || !Number.isFinite(Number(body.amount))) fail(400, "Giao dịch hoặc số tiền không khớp");
    // Acknowledging duplicate / out-of-order notifications never demotes a captured payment.
    if (["SUCCESS", "REFUNDED"].includes(payment.status)) return { duplicate: true };
    if (resultCode !== 0) {
      await client.query("UPDATE payments SET status='FAILED',provider_result_code=$1,provider_message=$2 WHERE id=$3 AND status='PENDING'", [resultCode, String(body.message || "").slice(0,1000), payment.id]);
      return { failed: true };
    }
    if (!body.transId || String(body.transId) === "0") fail(400, "Thiếu mã giao dịch thành công");
    const transactionId = String(body.transId);
    const sameTransaction = (await client.query("SELECT id FROM payments WHERE method='MOMO' AND transaction_id=$1 AND id<>$2 AND status IN ('SUCCESS','REFUNDED')", [transactionId, payment.id])).rows[0];
    if (sameTransaction) fail(409, "Mã giao dịch đã được sử dụng");
    await client.query(`UPDATE payments SET status='SUCCESS',transaction_id=$1,paid_at=LOCALTIMESTAMP,
      provider_result_code=0,provider_message=$2 WHERE id=$3`, [transactionId, String(body.message || "").slice(0,1000), payment.id]);
    let reason = null;
    const otherPaid = await client.query("SELECT id FROM payments WHERE booking_id=$1 AND id<>$2 AND status='SUCCESS'", [bookingId, payment.id]);
    if (otherPaid.rows.length) reason = "Đơn đã có giao dịch thành công khác";
    else {
      try { await flow.requirePayable(client, loaded); }
      catch (error) { if (!error.status) throw error; reason = error.message; }
    }
    if (reason) {
      await flow.openReview(client, payment, reason);
      if (loaded.booking.status !== "CONFIRMED") {
        await client.query("UPDATE bookings SET status='PAYMENT_REVIEW' WHERE id=$1", [bookingId]);
        await client.query("UPDATE booking_details SET seat_status='EXPIRED' WHERE booking_id=$1 AND seat_status='HOLD'", [bookingId]);
      }
      return { review: true };
    }
    await flow.confirmBooking(client, bookingId);
    return { confirmed: true };
  });
  if (result.confirmed) void sendPaymentEmailSafely(bookingId);
  res.json({ message: "Đã ghi nhận kết quả thanh toán", ...result });
});

exports.getStatus = endpoint(async (req, res) => {
  const id = positiveId(req.params.bookingId);
  const data = await transaction(async (client) => {
    await flow.expireHolds(client);
    const loaded = await flow.loadBooking(client, id, req.user.id);
    const payments = (await client.query("SELECT id,method,amount,status,momo_order_id,transaction_id,paid_at FROM payments WHERE booking_id=$1 ORDER BY id DESC", [id])).rows;
    const reviews = (await client.query("SELECT id,reason,status FROM payment_review_cases WHERE booking_id=$1", [id])).rows;
    return { booking: loaded.booking, payments, reviews };
  });
  res.json(data);
});

exports.resolveReview = endpoint(async (req, res) => {
  const note = String(req.body.note || "").trim();
  const reference = String(req.body.refund_reference || "").trim();
  if (note.length < 5 || note.length > 2000 || !reference || reference.length > 200) fail(400, "Cần ghi chú và mã xác nhận hoàn tiền thực tế");
  await transaction(async (client) => {
    const review = (await client.query("SELECT * FROM payment_review_cases WHERE id=$1 FOR UPDATE", [positiveId(req.params.reviewId)])).rows[0];
    if (!review) fail(404, "Không tìm thấy hồ sơ đối soát");
    if (review.status === "REFUNDED") return;
    await client.query("UPDATE payment_review_cases SET status='REFUNDED',resolution_note=$1,refund_reference=$2,resolved_by=$3,resolved_at=now() WHERE id=$4", [note, reference, req.user.id, review.id]);
    await client.query("UPDATE payments SET status='REFUNDED' WHERE id=$1 AND status='SUCCESS'", [review.payment_id]);
    await client.query(`UPDATE bookings b SET status='CANCELLED' WHERE b.id=$1 AND b.status='PAYMENT_REVIEW'
      AND NOT EXISTS(SELECT FROM payment_review_cases r WHERE r.booking_id=b.id AND r.status='OPEN')`, [review.booking_id]);
  });
  res.json({ message: "Đã ghi nhận xác nhận hoàn tiền" });
});

exports.momoReturn = endpoint(async (req, res) => res.json({ message: "Kết quả được xác nhận qua IPN và API trạng thái đơn" }));

exports.getAllPayments = endpoint(async (req, res) => {
  const data = await transaction(async (client) => {
    await flow.expireHolds(client);
    return (await client.query(`SELECT p.id AS payment_id,b.id AS booking_id,b.booking_code,b.total_price,b.status AS booking_status,
      b.created_at AS booking_date,b.flight_date,b.departure_place,b.arrival_place,b.departure_time_text,b.arrival_time_text,
      b.airline_name,b.flight_number_snapshot,b.seat_number_snapshot,u.id AS user_id,u.full_name AS customer_name,u.email AS customer_email,u.phone AS customer_phone,
      d.passenger_name,d.email AS passenger_email,d.phone AS passenger_phone,d.seat_class,d.seat_status,
      d.baggage_weight,d.baggage_price,d.meal_type,d.meal_price,d.insurance,d.insurance_price,
      p.method AS payment_method,p.status AS payment_status,p.amount AS payment_amount,p.paid_at,p.transaction_id,
      r.id AS review_id,r.status AS review_status,r.reason AS review_reason
      FROM bookings b JOIN users u ON u.id=b.user_id
      LEFT JOIN LATERAL(SELECT * FROM booking_details WHERE booking_id=b.id ORDER BY id DESC LIMIT 1) d ON true
      LEFT JOIN payments p ON p.booking_id=b.id LEFT JOIN payment_review_cases r ON r.payment_id=p.id
      WHERE b.booking_code NOT LIKE 'TMP%' ORDER BY b.created_at DESC,p.id DESC`)).rows;
  });
  res.json({ data });
});
