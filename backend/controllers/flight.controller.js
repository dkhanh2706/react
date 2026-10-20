const pool = require("../config/database");
const { endpoint, fail, transaction, positiveId } = require("../lib/http");
const { validDate, vietnamToday } = require("../lib/validation");
const flow = require("../services/booking.service");
const demo = require("../services/demoFlights.service");
const routePolicy = require("../lib/flightRoutes");

const joins = `FROM flights f JOIN airlines a ON a.id=f.airline_id
  JOIN airports da ON da.id=f.departure_airport_id JOIN airports aa ON aa.id=f.arrival_airport_id`;
const fields = `f.*,a.name AS airline,da.code AS departure_code,aa.code AS arrival_code,
  da.city AS departure_city,aa.city AS arrival_city`;
const availableSeats = `(SELECT count(*) FROM seats s WHERE s.airplane_id=f.airplane_id
  AND NOT EXISTS(SELECT FROM booking_details d WHERE d.flight_id=f.id AND d.seat_id=s.id
    AND (d.seat_status='BOOKED' OR (d.seat_status='HOLD' AND d.hold_expires_at>LOCALTIMESTAMP))))`;

exports.searchFlight = endpoint(async (req, res) => {
  const from = String(req.query.from || "").trim().toUpperCase();
  const to = String(req.query.to || "").trim().toUpperCase();
  const date = String(req.query.date || "");
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to) || from === to || !validDate(date) || date < vietnamToday()) fail(400, "Điểm đi, điểm đến hoặc ngày bay không hợp lệ");
  const page = positiveId(req.query.page || 1, "Trang");
  const pageSize = Math.min(50, positiveId(req.query.page_size || 10, "Số kết quả"));
  const airports = (await pool.query("SELECT id,code,country FROM airports ORDER BY id")).rows;
  const departure = airports.find(a => a.code === from), arrival = airports.find(a => a.code === to);
  if (!departure || !arrival) fail(400, "Sân bay không tồn tại");
  if (!routePolicy.allowed(departure, arrival)) return res.json({ data: [], count: 0, total: 0, page, page_size: pageSize, total_pages: 0,
    message: "Chuyến quốc tế chỉ đi/đến Nội Bài (HAN) hoặc Tân Sơn Nhất (SGN); không khai thác tuyến giữa hai sân bay nước ngoài" });
  if (demo.enabled()) await transaction(client => demo.ensureFlight(client, airports, departure, arrival, date));
  const where = `WHERE da.code=$1 AND aa.code=$2 AND f.departure_time::date=$3::date
    AND f.status='AVAILABLE' AND f.departure_time>LOCALTIMESTAMP AND f.price>0 AND ${availableSeats}>0`;
  const values = [from, to, date];
  const total = Number((await pool.query(`SELECT count(*) ${joins} ${where}`, values)).rows[0].count);
  const { rows } = await pool.query(`SELECT ${fields}, ${availableSeats} AS available_seats,
    to_char(f.departure_time,'YYYY-MM-DD') AS date,to_char(f.departure_time,'HH24:MI') AS departure_clock,
    to_char(f.arrival_time,'HH24:MI') AS arrival_clock ${joins} ${where}
    ORDER BY f.departure_time,f.id LIMIT $4 OFFSET $5`, [...values, pageSize, (page-1)*pageSize]);
  const data = rows.map(f => ({ ...f, from: f.departure_code, to: f.arrival_code, price: Number(f.price), departure_datetime: f.departure_time, arrival_datetime: f.arrival_time, departure_time: f.departure_clock, arrival_time: f.arrival_clock, type: "Bay thẳng" }));
  res.json({ data, count: data.length, total, page, page_size: pageSize, total_pages: Math.ceil(total/pageSize) });
});
exports.getAllFlights = endpoint(async (req, res) => {
  res.json({ data: (await pool.query(`SELECT ${fields},
    (SELECT count(*)::int FROM seats s WHERE s.airplane_id=f.airplane_id) AS total_seats,
    (SELECT count(*)::int FROM booking_details d WHERE d.flight_id=f.id AND d.seat_status='BOOKED') AS booked_seats,
    (SELECT count(*)::int FROM booking_details d WHERE d.flight_id=f.id AND d.seat_status='HOLD' AND d.hold_expires_at>LOCALTIMESTAMP) AS held_seats,
    EXISTS(SELECT FROM booking_details d WHERE d.flight_id=f.id UNION ALL SELECT FROM tickets t WHERE t.flight_id=f.id
      UNION ALL SELECT FROM bookings b WHERE b.flight_number_snapshot=f.flight_number) AS has_history,
    (f.status='AVAILABLE' AND f.departure_time>LOCALTIMESTAMP AND f.price>0 AND ${availableSeats}>0) AS is_sellable
    ${joins} ORDER BY f.departure_time DESC,f.id DESC`)).rows });
});
exports.catalog = endpoint(async (req, res) => {
  const [airports, airlines, airplanes] = await Promise.all([pool.query("SELECT id,code,name,city,country FROM airports ORDER BY code"), pool.query("SELECT id,name,code FROM airlines ORDER BY name"), pool.query("SELECT id,airline_id,model,seat_capacity FROM airplanes ORDER BY id")]);
  res.json({ airports: airports.rows, airlines: airlines.rows, airplanes: airplanes.rows, routes: routePolicy.routesFor(airports.rows) });
});
function dateTime(value) {
  const str = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str) || !validDate(str.slice(0,10)) || Number(str.slice(11,13))>23 || Number(str.slice(14,16))>59) fail(400, "Thời gian chuyến bay không hợp lệ");
  return str;
}
async function saveFlight(req, id) {
  const f = req.body;
  const departure = dateTime(f.departure_time);
  const arrival = dateTime(f.arrival_time);
  const depId = positiveId(f.departure_airport_id);
  const arrId = positiveId(f.arrival_airport_id);
  const planeId = positiveId(f.airplane_id);
  const airlineId = positiveId(f.airline_id);
  const price = Number(f.price);
  const number = String(f.flight_number || "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,20}$/.test(number) || !Number.isFinite(price) || price<100000 || price>9999999999.99 || Math.round(price)!==price) fail(400, "Mã chuyến hoặc giá vé không hợp lệ");
  if (depId === arrId || arrival<=departure) fail(400, "Hành trình hoặc thời gian đến không hợp lệ");
  if (!["AVAILABLE","DELAYED"].includes(f.status)) fail(400, "Hãy dùng thao tác Hủy chuyến thay vì đổi trạng thái trực tiếp");
  if (f.status === "AVAILABLE" && new Date(`${departure}:00+07:00`)<=new Date()) fail(400, "Chỉ mở bán chuyến chưa khởi hành");
  return transaction(async client => {
    let old;
    if (id) {
      old = (await client.query("SELECT * FROM flights WHERE id=$1 FOR UPDATE", [id])).rows[0];
      if (!old) fail(404, "Không tìm thấy chuyến bay");
      const related = await client.query("SELECT id FROM booking_details WHERE flight_id=$1 UNION ALL SELECT id FROM tickets WHERE flight_id=$1 UNION ALL SELECT id FROM bookings WHERE flight_number_snapshot=$2", [id,old.flight_number]);
      if (related.rows.length && (old.flight_number!==number || Number(old.airline_id)!==airlineId ||
        Number(old.airplane_id)!==planeId || Number(old.departure_airport_id)!==depId || Number(old.arrival_airport_id)!==arrId)) {
        fail(409, "Chuyến có lịch sử đặt chỗ: không thể đổi mã chuyến, hãng, máy bay hoặc hành trình");
      }
    }
    const plane = (await client.query("SELECT id FROM airplanes WHERE id=$1 AND airline_id=$2", [planeId, airlineId])).rows[0];
    if (!plane) fail(400, "Máy bay không thuộc hãng đã chọn");
    const airports = await client.query("SELECT id,code,country FROM airports WHERE id=ANY($1::int[])", [[depId,arrId]]);
    if (airports.rows.length!==2) fail(400, "Sân bay không hợp lệ");
    if (f.status !== "CANCELLED" && !routePolicy.allowed(airports.rows.find(a => a.id === depId), airports.rows.find(a => a.id === arrId))) {
      fail(400, "Tuyến không hợp lệ: quốc tế chỉ đi/đến HAN hoặc SGN");
    }
    if (f.status !== "CANCELLED") {
      const overlap = await client.query(`SELECT id FROM flights WHERE airplane_id=$1 AND id<>$2
        AND status<>'CANCELLED' AND departure_time<$4::timestamp+interval '30 minutes'
        AND arrival_time>$3::timestamp-interval '30 minutes'`, [planeId,id || 0,departure,arrival]);
      if (overlap.rows.length) fail(409, "Máy bay cần ít nhất 30 phút nghỉ giữa hai chuyến");
    }
    const args = [number,airlineId,planeId,depId,arrId,departure,arrival,price,f.status];
    const saved = id ? (await client.query(`UPDATE flights SET flight_number=$1,airline_id=$2,airplane_id=$3,departure_airport_id=$4,
      arrival_airport_id=$5,departure_time=$6,arrival_time=$7,price=$8,status=$9 WHERE id=$10 RETURNING *`, [...args,id])).rows[0]
      : (await client.query(`INSERT INTO flights(flight_number,airline_id,airplane_id,departure_airport_id,arrival_airport_id,departure_time,arrival_time,price,status)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, args)).rows[0];
    return saved;
  });
}
async function cancelRelated(client,id,reason="Admin hủy chuyến bay") {
  const bookings = (await client.query(`SELECT DISTINCT b.id FROM bookings b JOIN booking_details d ON d.booking_id=b.id
    WHERE d.flight_id=$1 AND b.status IN ('PENDING','CONFIRMED')`, [id])).rows;
  for (const b of bookings) await flow.cancelBooking(client,await flow.loadBooking(client,b.id),reason);
}
exports.createFlight = endpoint(async (req,res) => res.json({ message: "Thêm chuyến thành công", data: await saveFlight(req) }));
exports.updateFlight = endpoint(async (req,res) => res.json({ message: "Cập nhật chuyến thành công", data: await saveFlight(req,positiveId(req.params.id)) }));
exports.cancelFlight = endpoint(async (req,res) => {
  const reason = String(req.body.reason || "").trim();
  if (reason.length < 5 || reason.length > 1000) fail(400,"Nhập lý do hủy từ 5 đến 1000 ký tự");
  const result = await transaction(async client => {
    const id = positiveId(req.params.id);
    const flight = (await client.query("SELECT * FROM flights WHERE id=$1 FOR UPDATE",[id])).rows[0];
    if (!flight) fail(404,"Không tìm thấy chuyến bay");
    if (flight.status === "CANCELLED") return "Chuyến bay đã được hủy trước đó";
    await client.query("UPDATE flights SET status='CANCELLED' WHERE id=$1",[id]);
    await cancelRelated(client,id,reason);
    return "Đã hủy chuyến và xử lý các đặt chỗ liên quan";
  });
  res.json({ message: result });
});
exports.deleteFlight = endpoint(async (req,res) => {
  const result = await transaction(async client => {
    const id = positiveId(req.params.id);
    const flight = (await client.query("SELECT * FROM flights WHERE id=$1",[id])).rows[0];
    if (!flight) fail(404,"Không tìm thấy chuyến bay");
    const used = await client.query("SELECT id FROM booking_details WHERE flight_id=$1 UNION ALL SELECT id FROM tickets WHERE flight_id=$1 UNION ALL SELECT id FROM bookings WHERE flight_number_snapshot=$2",[id,flight.flight_number]);
    if (used.rows.length || flight.demo_key) fail(409,"Chuyến demo hoặc có lịch sử không được xóa; hãy dùng thao tác Hủy chuyến");
    await client.query("DELETE FROM flights WHERE id=$1",[id]);
    return "Đã xóa chuyến chưa có dữ liệu liên quan";
  });
  res.json({ message: result });
});
exports.overview = endpoint(async (req,res) => {
  const { rows } = await pool.query(`SELECT
    (SELECT count(*) FROM flights) AS flight_count,(SELECT count(*) FROM users) AS user_count,
    (SELECT coalesce(sum(p.amount),0) FROM payments p JOIN bookings b ON b.id=p.booking_id
      WHERE p.method='MOMO' AND p.status='SUCCESS' AND b.status='CONFIRMED'
      AND NOT EXISTS(SELECT FROM payment_review_cases r WHERE r.payment_id=p.id AND r.status='OPEN')) AS revenue,
    (SELECT count(*) FROM seats s JOIN flights f ON f.airplane_id=s.airplane_id WHERE f.departure_time>LOCALTIMESTAMP AND f.status IN ('AVAILABLE','DELAYED')) AS offered_seats,
    (SELECT count(*) FROM booking_details d JOIN flights f ON f.id=d.flight_id WHERE d.seat_status='BOOKED' AND f.departure_time>LOCALTIMESTAMP AND f.status IN ('AVAILABLE','DELAYED')) AS booked_seats`);
  res.json(rows[0]);
});
