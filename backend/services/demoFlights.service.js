const { fail } = require("../lib/http");
const { routesFor } = require("../lib/flightRoutes");
const settings = require("../config/demoSchedule");
const MINUTE = 60000, DAY = 86400000, GAP = 30 * MINUTE;
const enabled = () => process.env.DEMO_FLIGHTS_ENABLED === "true" && process.env.NODE_ENV !== "production";
const stamp = time => new Date(time + 7 * 60 * MINUTE).toISOString().slice(0, 19);
const keyOf = (date, from, to) => `${date}:${from}:${to}`;
const timeOf = value => new Date(value).getTime();

// Build one day's timetable in memory. Only the requested route is later inserted.
// Planning all routes in the same order keeps plane allocations stable across searches.
function dailySchedule(airports, planes, existing, date) {
  const midnight = Date.parse(`${date}T00:00:00+07:00`);
  const routes = routesFor(airports).sort((a, b) => settings[a.kind].minutes - settings[b.kind].minutes || a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
  const calendars = new Map([...planes].sort((a, b) => a.id - b.id).map(p => [p.id, []]));
  const retained = new Map();
  for (const flight of existing) {
    if (flight.demo_key) retained.set(flight.demo_key, flight);
    const day = stamp(timeOf(flight.departure_time)).slice(0, 10);
    if (day === date) retained.set(keyOf(date, flight.departure_airport_id, flight.arrival_airport_id), flight);
    const calendar = calendars.get(flight.airplane_id);
    if (calendar && flight.status !== "CANCELLED") calendar.push({ start: timeOf(flight.departure_time), end: timeOf(flight.arrival_time) });
  }
  const schedule = new Map();
  for (const route of routes) {
    const key = keyOf(date, route.departure_airport_id, route.arrival_airport_id);
    if (retained.has(key)) { schedule.set(key, retained.get(key)); continue; }
    const template = settings[route.kind];
    let choice;
    for (const plane of planes) {
      const calendar = calendars.get(plane.id).sort((a, b) => a.start - b.start);
      let at = midnight + 6 * 60 * MINUTE;
      for (const busy of calendar) {
        if (at + template.minutes * MINUTE + GAP <= busy.start) break;
        if (at < busy.end + GAP && at + template.minutes * MINUTE + GAP > busy.start) at = Math.ceil((busy.end + GAP) / (15 * MINUTE)) * 15 * MINUTE;
      }
      if (at < midnight + DAY && (!choice || at < choice.at)) choice = { at, plane };
    }
    if (!choice) continue;
    const end = choice.at + template.minutes * MINUTE;
    const flight = { demo_key: key, flight_number: `DT${date.replaceAll("-", "")}-${Number(route.departure_airport_id).toString(36)}-${Number(route.arrival_airport_id).toString(36)}`.toUpperCase(),
      airline_id: choice.plane.airline_id, airplane_id: choice.plane.id, departure_airport_id: route.departure_airport_id, arrival_airport_id: route.arrival_airport_id,
      departure_time: stamp(choice.at), arrival_time: stamp(end), price: template.price, status: "AVAILABLE" };
    calendars.get(choice.plane.id).push({ start: choice.at, end });
    schedule.set(key, flight);
  }
  return schedule;
}

async function demoPlanes(client) {
  return (await client.query(`SELECT p.id,p.airline_id FROM airplanes p JOIN airlines a ON a.id=p.airline_id
    WHERE a.code=$1 AND p.model=ANY($2::text[]) AND EXISTS(SELECT FROM seats s WHERE s.airplane_id=p.id) ORDER BY p.id`, [settings.airlineCode, settings.planeModels])).rows;
}

// Caller holds the same transaction/advisory lock as booking and admin flight writes.
async function ensureFlight(client, airports, from, to, date) {
  const key = keyOf(date, from.id, to.id);
  const found = await client.query(`SELECT id FROM flights WHERE demo_key=$1 OR
    (departure_airport_id=$2 AND arrival_airport_id=$3 AND departure_time >= $4::date AND departure_time < $4::date+interval '1 day') LIMIT 1`, [key, from.id, to.id, date]);
  if (found.rows.length) return;
  const planes = await demoPlanes(client);
  if (planes.length !== settings.planeModels.length) fail(503, "Chưa đủ máy bay demo. Cần hoàn tất bước chuẩn bị lịch mẫu trước khi tìm chuyến mới");
  const existing = (await client.query(`SELECT * FROM flights WHERE demo_key LIKE $2 OR
    (departure_time < $1::date+interval '2 days' AND arrival_time > $1::date-interval '1 day') ORDER BY id`, [date, `${date}:%`])).rows;
  const flight = dailySchedule(airports, planes, existing, date).get(key);
  if (!flight) fail(409, "Chưa bố trí được máy bay cho tuyến/ngày này; vui lòng kiểm tra lịch demo");
  if (flight.id || Date.parse(flight.departure_time + "+07:00") <= Date.now()) return;
  await client.query(`INSERT INTO flights(demo_key,flight_number,airline_id,airplane_id,departure_airport_id,arrival_airport_id,departure_time,arrival_time,price,status)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'AVAILABLE')`, [flight.demo_key, flight.flight_number, flight.airline_id, flight.airplane_id,
    flight.departure_airport_id, flight.arrival_airport_id, flight.departure_time, flight.arrival_time, flight.price]);
}

module.exports = { enabled, dailySchedule, ensureFlight, demoPlanes, keyOf };
