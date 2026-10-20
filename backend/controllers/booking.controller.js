const crypto = require("crypto");
const pool = require("../config/database");
const { endpoint, fail, transaction, positiveId } = require("../lib/http");
const { passengerData, pricing } = require("../lib/validation");
const flow = require("../services/booking.service");
const { sendPaymentEmailSafely } = require("../services/receipt.service");

exports.holdSeat = endpoint(async (req, res) => {
  const flightId = positiveId(req.body.flight_id, "Chuyến bay");
  const seatId = positiveId(req.body.seat_id, "Ghế");
  const data = await transaction(async (client) => {
    await flow.expireHolds(client);
    const flight = await flow.flightSeat(client, flightId, seatId);
    flow.requireBookable(flight);
    const existing = (await client.query(`SELECT d.*, b.user_id FROM booking_details d
      JOIN bookings b ON b.id=d.booking_id WHERE d.flight_id=$1 AND d.seat_id=$2
      AND d.seat_status IN ('HOLD','BOOKED')`, [flightId, seatId])).rows[0];
    if (existing) {
      if (existing.seat_status === "HOLD" && Number(existing.user_id) === req.user.id) return { booking_id: existing.booking_id, detail: existing, hold_expires_at: existing.hold_expires_at };
      fail(409, "Ghế đang được giữ hoặc đã được đặt");
    }
    // Keep all reservation history; never reassign another booking's detail row.
    await client.query(`UPDATE booking_details d SET seat_status='EXPIRED'
      FROM bookings b WHERE b.id=d.booking_id AND b.user_id=$1 AND d.flight_id=$2 AND d.seat_status='HOLD'`, [req.user.id, flightId]);
    await flow.expireHolds(client);
    const booking = (await client.query("INSERT INTO bookings(user_id,booking_code,total_price,status) VALUES($1,$2,0,'PENDING') RETURNING *", [req.user.id, `TMP${crypto.randomUUID()}`])).rows[0];
    const detail = (await client.query(`INSERT INTO booking_details(booking_id,flight_id,seat_id,seat_class,price,seat_status,hold_expires_at)
      VALUES($1,$2,$3,$4,0,'HOLD',LOCALTIMESTAMP+interval '15 minutes') RETURNING *`, [booking.id, flightId, seatId, flight.seat_class])).rows[0];
    return { booking_id: booking.id, detail, hold_expires_at: detail.hold_expires_at };
  });
  res.json({ message: "Giữ ghế thành công trong 15 phút", ...data });
});

exports.createBooking = endpoint(async (req, res) => {
  const flightId = positiveId(req.body.flight_id);
  const seatId = positiveId(req.body.seat_id);
  const passenger = passengerData(req.body.passenger);
  const data = await transaction(async (client) => {
    await flow.expireHolds(client);
    const flight = await flow.flightSeat(client, flightId, seatId);
    flow.requireBookable(flight);
    const hold = (await client.query(`SELECT d.* FROM booking_details d JOIN bookings b ON b.id=d.booking_id
      WHERE d.flight_id=$1 AND d.seat_id=$2 AND b.user_id=$3 AND b.status='PENDING'
      AND d.seat_status='HOLD' AND d.hold_expires_at>LOCALTIMESTAMP`, [flightId, seatId, req.user.id])).rows[0];
    if (!hold) fail(409, "Lượt giữ ghế đã hết hạn hoặc không thuộc tài khoản của bạn");
    const existingPayments = await client.query("SELECT id FROM payments WHERE booking_id=$1", [hold.booking_id]);
    if (existingPayments.rows.length) fail(409, "Đơn đã bắt đầu thanh toán; không thể thay đổi thông tin hoặc giá");
    const calculated = pricing(flight.price, flight.seat_class, req.body.services);
    const { services, pricing: costs } = calculated;
    const booking = (await client.query(`UPDATE bookings SET booking_code=CASE WHEN booking_code LIKE 'TMP%' THEN $1 ELSE booking_code END,
      total_price=$2,flight_date=$3,departure_place=$4,arrival_place=$5,departure_time_text=$6,
      arrival_time_text=$7,airline_name=$8,flight_number_snapshot=$9,seat_number_snapshot=$10 WHERE id=$11 RETURNING *`,
      [`BK${crypto.randomUUID()}`, costs.total_price, flight.flight_date, flight.departure_code, flight.arrival_code, flight.departure_clock, flight.arrival_clock, flight.airline, flight.flight_number, flight.seat_number, hold.booking_id])).rows[0];
    const detail = (await client.query(`UPDATE booking_details SET seat_class=$1,price=$2,passenger_name=$3,email=$4,phone=$5,
      gender=$6,date_of_birth=$7,document_type=$8,document_number=$9,baggage_weight=$10,baggage_price=$11,
      meal_type=$12,meal_price=$13,insurance=$14,insurance_price=$15 WHERE id=$16 RETURNING *`,
      [flight.seat_class, costs.seat_fare, passenger.full_name, passenger.email, passenger.phone, passenger.gender, passenger.date_of_birth, passenger.document_type, passenger.document_number,
        services.baggage_weight, services.baggage_price, services.meal_type, services.meal_price, services.insurance, services.insurance_price, hold.id])).rows[0];
    return { booking, detail, passenger, services, pricing: costs, hold_expires_at: hold.hold_expires_at };
  });
  res.json({ message: "Tạo booking thành công", ...data });
});

exports.confirmPayment = endpoint(async (req, res) => {
  if (!flow.demoEnabled()) fail(403, "Thanh toán giả lập chỉ khả dụng trong chế độ demo");
  const id = positiveId(req.params.bookingId);
  const result = await transaction(async (client) => {
    await flow.expireHolds(client);
    const loaded = await flow.loadBooking(client, id, req.user.id);
    const paid = (await client.query("SELECT * FROM payments WHERE booking_id=$1 AND status='SUCCESS'", [id])).rows[0];
    if (paid && loaded.booking.status === "CONFIRMED") return { booking: loaded.booking, payment: paid, already: true };
    await flow.requirePayable(client, loaded);
    const pending = await client.query("SELECT id FROM payments WHERE booking_id=$1 AND method='MOMO' AND status='PENDING'", [id]);
    if (pending.rows.length) fail(409, "Đang có giao dịch MoMo; không thể dùng giả lập cho đơn này");
    const payment = (await client.query("INSERT INTO payments(booking_id,method,amount,status,paid_at) VALUES($1,'MOCK',$2,'SUCCESS',LOCALTIMESTAMP) RETURNING *", [id, loaded.booking.total_price])).rows[0];
    await flow.confirmBooking(client, id);
    return { booking: { ...loaded.booking, status: "CONFIRMED" }, payment };
  });
  const emailSent = result.already ? false : Boolean(await sendPaymentEmailSafely(id));
  res.json({ message: "Thanh toán giả lập thành công", ...result, email_sent: emailSent });
});

exports.getMyTickets = endpoint(async (req, res) => {
  const { rows } = await pool.query(`SELECT b.*, d.id AS booking_detail_id,d.flight_id,d.seat_id,d.seat_class,d.price,d.seat_status,
    d.passenger_name,d.email,d.phone,d.gender,d.date_of_birth,d.document_type,d.document_number,
    d.baggage_weight,d.baggage_price,d.meal_type,d.meal_price,d.insurance,d.insurance_price,
    p.status AS payment_status,p.method AS payment_method,p.amount AS payment_amount,p.paid_at,p.transaction_id,
    f.status AS current_flight_status, f.departure_time AS current_departure_time,f.arrival_time AS current_arrival_time,
    f.flight_number AS current_flight_number,da.code AS current_departure_code,aa.code AS current_arrival_code,
    to_char(f.departure_time,'YYYY-MM-DD') AS current_flight_date,to_char(f.departure_time,'HH24:MI') AS current_departure_clock,
    to_char(f.arrival_time,'HH24:MI') AS current_arrival_clock
    FROM bookings b JOIN booking_details d ON d.booking_id=b.id JOIN flights f ON f.id=d.flight_id
    JOIN airports da ON da.id=f.departure_airport_id JOIN airports aa ON aa.id=f.arrival_airport_id
    JOIN LATERAL(SELECT * FROM payments p0 WHERE p0.booking_id=b.id AND p0.status IN ('SUCCESS','REFUNDED')
      ORDER BY (p0.status='SUCCESS' AND NOT EXISTS(SELECT FROM payment_review_cases r WHERE r.payment_id=p0.id AND r.status='OPEN')) DESC,p0.id DESC LIMIT 1) p ON true
    WHERE b.user_id=$1 ORDER BY b.created_at DESC`, [req.user.id]);
  res.json({ data: rows });
});

exports.getAdminBookings = endpoint(async (req, res) => {
  const data = await transaction(async (client) => {
    await flow.expireHolds(client);
    return (await client.query(`SELECT b.*,u.email AS customer_email,u.full_name AS customer_name,
      (SELECT json_agg(detail ORDER BY detail.id) FROM (
        SELECT d.*,f.flight_number,f.status AS flight_status,f.departure_time,f.arrival_time,s.seat_number
        FROM booking_details d JOIN flights f ON f.id=d.flight_id JOIN seats s ON s.id=d.seat_id
        WHERE d.booking_id=b.id
      ) detail) AS details,
      (SELECT json_agg(p ORDER BY p.id DESC) FROM payments p WHERE p.booking_id=b.id) AS payments,
      (SELECT json_agg(r ORDER BY r.id DESC) FROM payment_review_cases r WHERE r.booking_id=b.id) AS reviews
      FROM bookings b JOIN users u ON u.id=b.user_id ORDER BY b.created_at DESC`)).rows;
  });
  res.json({ data });
});

exports.deleteBooking = endpoint(async (req, res) => {
  const id = positiveId(req.params.bookingId);
  await transaction(async client => {
    const { booking } = await flow.loadBooking(client, id);
    if (req.body?.booking_code !== booking.booking_code) fail(400, "Nhập đúng mã đơn để xác nhận xóa vĩnh viễn");
    // Delete only this order's children. The shared write lock also serializes payment callbacks.
    await client.query("DELETE FROM payment_review_cases WHERE booking_id=$1", [id]);
    await client.query("DELETE FROM tickets WHERE booking_id=$1", [id]);
    await client.query("DELETE FROM passengers WHERE booking_id=$1", [id]);
    await client.query("DELETE FROM payments WHERE booking_id=$1", [id]);
    await client.query("DELETE FROM booking_details WHERE booking_id=$1", [id]);
    await client.query("DELETE FROM bookings WHERE id=$1", [id]);
  }).catch(error => {
    if (error.code === "42501") fail(403, "Tài khoản database chưa có quyền xóa. Quản trị database cần chạy migration 005_admin_booking_delete_permissions.sql");
    throw error;
  });
  res.json({ message: "Đã xóa vĩnh viễn đơn và dữ liệu liên quan" });
});
