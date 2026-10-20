const pool = require("../config/database");
const { endpoint, fail, positiveId } = require("../lib/http");
const routePolicy = require("../lib/flightRoutes");
exports.getSeatsByFlight = endpoint(async (req,res) => {
  const id = positiveId(req.params.flightId);
  const flight = (await pool.query(`SELECT f.airplane_id,da.code AS departure_code,aa.code AS arrival_code,
    da.country AS departure_country,aa.country AS arrival_country
    FROM flights f JOIN airports da ON da.id=f.departure_airport_id JOIN airports aa ON aa.id=f.arrival_airport_id
    WHERE f.id=$1 AND f.status='AVAILABLE' AND f.departure_time>LOCALTIMESTAMP`,[id])).rows[0];
  if (!flight) fail(409,"Chuyến bay đã ngừng bán hoặc đã khởi hành");
  if (!routePolicy.allowed({ code: flight.departure_code, country: flight.departure_country }, { code: flight.arrival_code, country: flight.arrival_country })) fail(409,"Tuyến bay không còn mở bán");
  const { rows } = await pool.query(`SELECT s.id,s.seat_number,s.class::text AS class,
    coalesce(d.seat_status,'AVAILABLE') AS status,d.hold_expires_at,
    coalesce(d.user_id=$3,false) AS held_by_me
    FROM seats s LEFT JOIN LATERAL(SELECT bd.seat_status,bd.hold_expires_at,b.user_id FROM booking_details bd
      JOIN bookings b ON b.id=bd.booking_id WHERE bd.flight_id=$1 AND bd.seat_id=s.id
      AND (bd.seat_status='BOOKED' OR (bd.seat_status='HOLD' AND bd.hold_expires_at>LOCALTIMESTAMP)) LIMIT 1) d ON true
    WHERE s.airplane_id=$2 ORDER BY s.class,s.seat_number`,[id,flight.airplane_id,req.user.id]);
  res.json(rows);
});
