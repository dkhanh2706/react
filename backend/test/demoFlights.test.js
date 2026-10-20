const { test } = require("node:test");
const assert = require("node:assert/strict");
const { dailySchedule, enabled, keyOf } = require("../services/demoFlights.service");
const { routesFor, allowed } = require("../lib/flightRoutes");
const airports = ["SGN","HAN","DAD","PQC","CXR","DLI","HUI","VCA","NRT","HND","SIN"].map((code, i) => ({
  id: i + 1, code, country: i < 8 ? "Vietnam" : code === "SIN" ? "Singapore" : "Japan",
}));
const planes = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, airline_id: 1 }));
const physical = (f, id) => ({ ...f, id, departure_time: f.departure_time + "+07:00", arrival_time: f.arrival_time + "+07:00" });
const byCode = code => airports.find(a => a.code === code);

function assertNoOverlap(flights) {
  for (const plane of planes) {
    const rows = flights.filter(f => f.airplane_id === plane.id).sort((a, b) => Date.parse(a.departure_time) - Date.parse(b.departure_time));
    for (let i = 1; i < rows.length; i++) assert.ok(Date.parse(rows[i].departure_time) - Date.parse(rows[i-1].arrival_time) >= 30 * 60000);
  }
}

test("8 domestic and 3 foreign airports yield exactly 56 domestic and 12 two-way hub routes", () => {
  const routes = routesFor(airports);
  assert.equal(routes.length, 68);
  assert.equal(routes.filter(r => r.kind === "DOMESTIC").length, 56);
  assert.equal(routes.filter(r => r.kind === "INTERNATIONAL").length, 12);
  for (const [a,b] of [["NRT","VCA"],["DAD","SIN"],["SIN","HND"],["HAN","HAN"]]) assert.equal(allowed(byCode(a),byCode(b)),false);
  for (const [a,b] of [["HAN","NRT"],["NRT","SGN"],["VCA","CXR"],["SIN","HAN"]]) assert.equal(allowed(byCode(a),byCode(b)),true);
  assert.equal(allowed({ code: "NEW", country: null }, byCode("HAN")), false);
  assert.equal(allowed({ code: "NEW", country: "Việt Nam" }, byCode("VCA")), true);
});

test("12 dedicated planes cover all 68 routes across successive days without overlaps", () => {
  const existing = [];
  for (let d = 1; d <= 7; d++) {
    const date = `2090-01-${String(d).padStart(2,"0")}`;
    const schedule = dailySchedule(airports, planes, existing, date);
    assert.equal(schedule.size, 68);
    for (const [key,f] of schedule) {
      assert.equal(key,keyOf(date,f.departure_airport_id,f.arrival_airport_id));
      assert.equal(f.departure_time.slice(0,10),date);
      const kind = airports.find(a => a.id === f.departure_airport_id).country === "Vietnam" && airports.find(a => a.id === f.arrival_airport_id).country === "Vietnam" ? "DOMESTIC" : "INTERNATIONAL";
      assert.equal(f.price,kind === "DOMESTIC" ? 1500000 : 5500000);
      assert.equal(Date.parse(f.arrival_time)-Date.parse(f.departure_time),(kind === "DOMESTIC" ? 2 : 8)*3600000);
      existing.push(physical(f,existing.length+1));
    }
  }
  assertNoOverlap(existing);
});

test("materializing routes in reverse search order retains enough space and never moves saved flights", () => {
  const date = "2090-04-12", existing = [];
  const keys = [...dailySchedule(airports,planes,[],date).keys()].reverse();
  for (const key of keys) {
    const schedule = dailySchedule(airports,planes,existing,date);
    assert.equal(schedule.size,68);
    const f = schedule.get(key);
    assert.ok(f);
    existing.push(physical(f,existing.length+1));
  }
  assertNoOverlap(existing);
  const rerun = dailySchedule(airports,planes,existing,date);
  for (const f of existing) assert.deepEqual(rerun.get(f.demo_key),f);
});

test("cancelled and rescheduled flights are preserved; lack of aircraft never invents capacity", () => {
  const date = "2090-04-12";
  const f = [...dailySchedule(airports,planes,[],date).values()][0];
  const cancelled = { ...physical(f,10), status: "CANCELLED", departure_time: "2090-05-01T06:00:00+07:00", arrival_time: "2090-05-01T08:00:00+07:00" };
  assert.deepEqual(dailySchedule(airports,planes,[cancelled],date).get(f.demo_key),cancelled);
  assert.ok(dailySchedule(airports,planes.slice(0,1),[],date).size < 68);
});

test("production never enables flight creation, even with the demo flag", () => {
  const before = { flag: process.env.DEMO_FLIGHTS_ENABLED, env: process.env.NODE_ENV };
  try {
    process.env.DEMO_FLIGHTS_ENABLED="true";process.env.NODE_ENV="production";assert.equal(enabled(),false);
    process.env.NODE_ENV="development";assert.equal(enabled(),true);
    process.env.DEMO_FLIGHTS_ENABLED="false";assert.equal(enabled(),false);
  } finally {
    for (const [key,value] of [["DEMO_FLIGHTS_ENABLED",before.flag],["NODE_ENV",before.env]]) {
      if (value === undefined) delete process.env[key]; else process.env[key]=value;
    }
  }
});
