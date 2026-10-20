const { fail } = require("../lib/http");
const routePolicy = require("../lib/flightRoutes");

const demoEnabled = () => process.env.DEMO_PAYMENTS_ENABLED === "true" && process.env.NODE_ENV !== "production";

async function expireHolds(client) {
  await client.query(`UPDATE booking_details SET seat_status='EXPIRED'
    WHERE seat_status='HOLD' AND hold_expires_at<=LOCALTIMESTAMP`);
  await client.query(`UPDATE bookings b SET status='EXPIRED'
    WHERE b.status='PENDING' AND EXISTS(SELECT FROM booking_details d WHERE d.booking_id=b.id)
    AND NOT EXISTS(SELECT FROM booking_details d WHERE d.booking_id=b.id AND d.seat_status IN ('HOLD','BOOKED'))`);
}

async function flightSeat(client, flightId, seatId) {
  const row = (await client.query(`SELECT f.*, a.name AS airline,
      da.code AS departure_code, aa.code AS arrival_code,
      da.country AS departure_country, aa.country AS arrival_country,
      to_char(f.departure_time,'YYYY-MM-DD') AS flight_date,
      to_char(f.departure_time,'HH24:MI') AS departure_clock,
      to_char(f.arrival_time,'HH24:MI') AS arrival_clock,
      f.departure_time>LOCALTIMESTAMP AS future,
      s.id AS seat_id, s.seat_number, s.class::text AS seat_class
    FROM flights f JOIN airlines a ON a.id=f.airline_id
    JOIN airports da ON da.id=f.departure_airport_id
    JOIN airports aa ON aa.id=f.arrival_airport_id
    JOIN seats s ON s.airplane_id=f.airplane_id AND s.id=$2
    WHERE f.id=$1`, [flightId, seatId])).rows[0];
  return row;
}

function requireBookable(flight) {
  if (!flight) fail(404, "Chuyến bay hoặc ghế không hợp lệ");
  if (!routePolicy.allowed({ code: flight.departure_code, country: flight.departure_country }, { code: flight.arrival_code, country: flight.arrival_country })) fail(409, "Tuyến bay không còn mở bán theo quy tắc nội địa/quốc tế");
  if (flight.status !== "AVAILABLE" || !flight.future) fail(409, "Chuyến bay đã ngừng bán hoặc đã khởi hành");
}

async function loadBooking(client, id, userId) {
  const booking = (await client.query("SELECT * FROM bookings WHERE id=$1 FOR UPDATE", [id])).rows[0];
  if (!booking || (userId !== undefined && Number(booking.user_id) !== Number(userId))) fail(404, "Không tìm thấy đơn đặt vé");
  const details = (await client.query("SELECT * FROM booking_details WHERE booking_id=$1 ORDER BY id FOR UPDATE", [id])).rows;
  return { booking, details, detail: details[0] };
}

function completeBooking(booking, details) {
  return !booking.booking_code.startsWith("TMP") && Number(booking.total_price) > 0
    && details.length === 1 && Boolean(details[0].passenger_name && details[0].email
      && details[0].phone && details[0].document_number && details[0].date_of_birth);
}

async function requirePayable(client, loaded) {
  const { booking, details, detail } = loaded;
  if (booking.status !== "PENDING" || !completeBooking(booking, details)) fail(409, "Đơn chưa hoàn tất, đã hết hạn hoặc đã được xử lý");
  if (detail.seat_status !== "HOLD" || !detail.hold_expires_at || new Date(detail.hold_expires_at) <= new Date()) fail(409, "Thời gian giữ ghế đã hết");
  requireBookable(await flightSeat(client, detail.flight_id, detail.seat_id));
}

async function confirmBooking(client, bookingId) {
  await client.query("UPDATE bookings SET status='CONFIRMED' WHERE id=$1", [bookingId]);
  await client.query("UPDATE booking_details SET seat_status='BOOKED', hold_expires_at=NULL WHERE booking_id=$1", [bookingId]);
}

async function openReview(client, payment, reason) {
  await client.query(`INSERT INTO payment_review_cases(payment_id,booking_id,reason)
    VALUES($1,$2,$3) ON CONFLICT(payment_id) DO NOTHING`, [payment.id, payment.booking_id, reason]);
}

async function cancelBooking(client, loaded, reason) {
  const { booking } = loaded;
  const payments = (await client.query("SELECT * FROM payments WHERE booking_id=$1 AND status='SUCCESS'", [booking.id])).rows;
  for (const payment of payments) await openReview(client, payment, reason);
  await client.query(`UPDATE bookings SET status=$2,cancelled_at=now(),cancellation_reason=$3 WHERE id=$1`,
    [booking.id, payments.length ? "PAYMENT_REVIEW" : "CANCELLED", reason]);
  await client.query("UPDATE booking_details SET seat_status='CANCELLED' WHERE booking_id=$1 AND seat_status IN ('HOLD','BOOKED')", [booking.id]);
}

module.exports = { demoEnabled, expireHolds, flightSeat, requireBookable, loadBooking, completeBooking, requirePayable, confirmBooking, openReview, cancelBooking };
