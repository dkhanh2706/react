const pool = require("../config/database");
const { fail } = require("../lib/http");
const { validDate, vietnamToday } = require("../lib/validation");

function statisticsRange(query) {
  const today = vietnamToday();
  const from = query.from === undefined ? `${today.slice(0, 7)}-01` : query.from;
  const to = query.to === undefined ? today : query.to;
  if (typeof from !== "string" || typeof to !== "string" || !validDate(from) || !validDate(to) || from > to) fail(400, "Khoảng ngày không hợp lệ");
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000 + 1;
  if (days > 366) fail(400, "Chọn khoảng thời gian tối đa 366 ngày");
  const group = query.group || (days > 62 ? "month" : "day");
  if (!["day", "month"].includes(group)) fail(400, "Chỉ hỗ trợ thống kê theo ngày hoặc tháng");
  return { from, to, group };
}

// A single statement gives every panel the same database snapshot. No expiry writes
// are needed: live holds are evaluated against LOCALTIMESTAMP in the query itself.
const statisticsSql = `
WITH accepted_payments AS (
  SELECT DISTINCT ON (p.booking_id) p.id, p.booking_id, p.method, p.amount, p.paid_at,
    d.flight_id, b.total_price
  FROM payments p
  JOIN bookings b ON b.id = p.booking_id
  JOIN booking_details d ON d.booking_id = b.id
  JOIN flights f ON f.id = d.flight_id
  WHERE p.status = 'SUCCESS' AND b.status = 'CONFIRMED' AND d.seat_status = 'BOOKED'
    AND f.status <> 'CANCELLED'
    AND NOT EXISTS (SELECT FROM payment_review_cases r WHERE r.payment_id = p.id AND r.status = 'OPEN')
  ORDER BY p.booking_id, p.id
), scoped_flights AS (
  SELECT f.*, a.name AS airline, da.code AS departure_code, aa.code AS arrival_code
  FROM flights f JOIN airlines a ON a.id = f.airline_id
  JOIN airports da ON da.id = f.departure_airport_id
  JOIN airports aa ON aa.id = f.arrival_airport_id
  WHERE f.departure_time >= $1::date AND f.departure_time < $2::date + interval '1 day'
), flight_metrics AS (
  SELECT f.id, f.flight_number, f.airline, f.departure_code, f.arrival_code, f.status,
    to_char(f.departure_time, 'YYYY-MM-DD') AS departure_date,
    to_char(f.departure_time, 'HH24:MI') AS departure_clock,
    (SELECT count(*)::int FROM seats s WHERE s.airplane_id = f.airplane_id) AS total_seats,
    (SELECT count(DISTINCT d.seat_id)::int FROM booking_details d JOIN bookings b ON b.id = d.booking_id
      WHERE d.flight_id = f.id AND d.seat_status = 'BOOKED' AND b.status = 'CONFIRMED') AS booked_seats,
    (SELECT count(DISTINCT d.seat_id)::int FROM booking_details d JOIN bookings b ON b.id = d.booking_id
      WHERE d.flight_id = f.id AND d.seat_status = 'HOLD' AND b.status = 'PENDING'
        AND d.hold_expires_at > LOCALTIMESTAMP) AS held_seats,
    (SELECT coalesce(sum(p.total_price), 0) FROM accepted_payments p WHERE p.flight_id = f.id) AS confirmed_value,
    (SELECT coalesce(sum(b.total_price), 0) FROM bookings b
      WHERE b.status = 'PENDING' AND b.total_price > 0 AND b.booking_code NOT LIKE 'TMP%'
        AND f.status = 'AVAILABLE' AND f.departure_time > LOCALTIMESTAMP
        AND EXISTS (SELECT FROM booking_details d WHERE d.booking_id = b.id AND d.flight_id = f.id
          AND d.seat_status = 'HOLD' AND d.hold_expires_at > LOCALTIMESTAMP
          AND d.passenger_name IS NOT NULL AND d.email IS NOT NULL AND d.phone IS NOT NULL
          AND d.date_of_birth IS NOT NULL AND d.document_number IS NOT NULL)
        AND NOT EXISTS (SELECT FROM payments p WHERE p.booking_id = b.id AND p.status IN ('SUCCESS', 'REFUNDED'))
    ) AS pending_value
  FROM scoped_flights f
), revenue_by_period AS (
  SELECT date_trunc($3, p.paid_at)::date AS period,
    sum(p.amount) FILTER (WHERE p.method = 'MOMO') AS momo,
    sum(p.amount) FILTER (WHERE p.method = 'MOCK') AS mock
  FROM accepted_payments p
  WHERE p.paid_at >= $1::date AND p.paid_at < $2::date + interval '1 day'
  GROUP BY 1
), flights_by_period AS (
  SELECT date_trunc($3, f.departure_time)::date AS period, count(*)::int AS total,
    count(*) FILTER (WHERE f.status = 'AVAILABLE')::int AS available,
    count(*) FILTER (WHERE f.status = 'DELAYED')::int AS delayed,
    count(*) FILTER (WHERE f.status = 'CANCELLED')::int AS cancelled,
    count(*) FILTER (WHERE f.status IS NULL OR f.status NOT IN ('AVAILABLE','DELAYED','CANCELLED'))::int AS other
  FROM scoped_flights f GROUP BY 1
), periods AS (
  SELECT generate_series(date_trunc($3, $1::date::timestamp), date_trunc($3, $2::date::timestamp),
    CASE WHEN $3 = 'month' THEN interval '1 month' ELSE interval '1 day' END)::date AS period
)
SELECT
  (SELECT row_to_json(summary) FROM (
    SELECT count(*)::int AS flight_count,
      count(*) FILTER (WHERE status = 'AVAILABLE')::int AS available_flights,
      count(*) FILTER (WHERE status = 'DELAYED')::int AS delayed_flights,
      count(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled_flights,
      coalesce(sum(total_seats) FILTER (WHERE status IN ('AVAILABLE','DELAYED')), 0) AS offered_seats,
      coalesce(sum(booked_seats) FILTER (WHERE status IN ('AVAILABLE','DELAYED')), 0) AS booked_seats,
      coalesce(sum(held_seats) FILTER (WHERE status IN ('AVAILABLE','DELAYED')), 0) AS held_seats,
      coalesce(sum(confirmed_value) FILTER (WHERE status IN ('AVAILABLE','DELAYED')), 0) AS confirmed_value,
      coalesce(sum(pending_value), 0) AS pending_value
    FROM flight_metrics
  ) summary) AS summary,
  (SELECT coalesce(json_agg(row_to_json(point) ORDER BY point.period), '[]'::json) FROM (
    SELECT to_char(p.period, 'YYYY-MM-DD') AS period, coalesce(r.momo, 0) AS momo, coalesce(r.mock, 0) AS mock
    FROM periods p LEFT JOIN revenue_by_period r USING (period)
  ) point) AS revenue_series,
  (SELECT coalesce(json_agg(row_to_json(point) ORDER BY point.period), '[]'::json) FROM (
    SELECT to_char(p.period, 'YYYY-MM-DD') AS period, coalesce(f.total, 0) AS total,
      coalesce(f.available, 0) AS available, coalesce(f.delayed, 0) AS delayed,
      coalesce(f.cancelled, 0) AS cancelled, coalesce(f.other, 0) AS other
    FROM periods p LEFT JOIN flights_by_period f USING (period)
  ) point) AS flight_series,
  (SELECT coalesce(json_agg(row_to_json(f) ORDER BY f.departure_date, f.departure_clock, f.id), '[]'::json) FROM flight_metrics f) AS flights
`;

async function getStatistics(query) {
  const range = statisticsRange(query);
  const { rows: [result] } = await pool.query(statisticsSql, [range.from, range.to, range.group]);
  const summary = Object.fromEntries(Object.entries(result.summary).map(([key, value]) => [key, Number(value)]));
  const revenue_series = result.revenue_series.map(p => ({ ...p, momo: Number(p.momo), mock: Number(p.mock) }));
  summary.momo_revenue = revenue_series.reduce((sum, p) => sum + p.momo, 0);
  summary.mock_revenue = revenue_series.reduce((sum, p) => sum + p.mock, 0);
  summary.paid_value = summary.momo_revenue + summary.mock_revenue;
  summary.projected_sales = summary.confirmed_value + summary.pending_value;
  summary.empty_seats = summary.offered_seats - summary.booked_seats - summary.held_seats;
  summary.occupancy_rate = summary.offered_seats ? summary.booked_seats / summary.offered_seats * 100 : null;
  const flights = result.flights.map(f => ({ ...f, confirmed_value: Number(f.confirmed_value), pending_value: Number(f.pending_value),
    empty_seats: f.status === 'CANCELLED' ? null : f.total_seats - f.booked_seats - f.held_seats,
    occupancy_rate: ['AVAILABLE', 'DELAYED'].includes(f.status) && f.total_seats ? f.booked_seats / f.total_seats * 100 : null,
  }));
  return { range, summary, revenue_series, flight_series: result.flight_series, flights, updated_at: new Date().toISOString() };
}

module.exports = { getStatistics, statisticsRange };
