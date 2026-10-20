const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const connection = process.env.TEST_DATABASE_URL;
if (!connection) throw new Error("Set TEST_DATABASE_URL to a NEW EMPTY local airline_booking_test[_suffix] database. See docs/booking-safety-handoff.md.");
const enabled = true;
let pool, server, base, customerToken, secondToken, adminToken, flightId, seats, bcrypt;
const delivered = [];
let momoCreates = 0;
const passenger = { full_name: "Nguyen Van Test", email: "test@example.test", phone: "0900000000", gender: "MALE", date_of_birth: "2000-01-01", document_type: "CCCD", document_number: "123456789012" };

async function request(url, { token, body, method = "GET" } = {}) {
  const response = await fetch(base + url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, data: await response.json() };
}
const hold = (seat, token = customerToken) => request("/api/bookings/hold-seat", { token, method: "POST", body: { flight_id: flightId, seat_id: seat, seat_class: "ECONOMY" } });
async function booking(seat, token = customerToken, overrides = {}) {
  assert.equal((await hold(seat, token)).status, 200);
  return request("/api/bookings", { token, method: "POST", body: { flight_id: flightId, seat_id: seat, seat_class: "ECONOMY", passenger, ...overrides } });
}
async function attempt(id) {
  return request("/api/payments/momo/create", { token: customerToken, method: "POST", body: { bookingId: id } });
}
function ipnBody(created, bookingId, resultCode = 0, overrides = {}) {
  const body = {
    partnerCode: process.env.MOMO_PARTNER_CODE, orderId: created.orderId, requestId: created.requestId,
    amount: 1000000, orderInfo: `Thanh toan ve ${bookingId}`, orderType: "momo_wallet",
    transId: crypto.randomInt(100000, 999999999), resultCode, message: resultCode ? "Failed" : "Success",
    payType: "qr", responseTime: Date.now(), extraData: Buffer.from(JSON.stringify({ bookingId })).toString("base64"),
    ...overrides,
  };
  const keys = ["amount","extraData","message","orderId","orderInfo","orderType","partnerCode","payType","requestId","responseTime","resultCode","transId"];
  body.signature = crypto.createHmac("sha256", process.env.MOMO_SECRET_KEY).update(`accessKey=${process.env.MOMO_ACCESS_KEY}` + keys.map(k => `&${k}=${body[k]}`).join("")).digest("hex");
  return body;
}

before(async () => {
  if (!enabled) return;
  const url = new URL(connection);
  if (!/^\/airline_booking_test(?:_[a-z0-9]+)?$/.test(url.pathname) || !["127.0.0.1", "localhost"].includes(url.hostname)) {
    throw new Error("Integration tests require a new, empty local airline_booking_test[_suffix] database. Production databases are prohibited.");
  }
  Object.assign(process.env, { DB_HOST: url.hostname, DB_PORT: url.port || "5432", DB_NAME: url.pathname.slice(1), DB_USER: decodeURIComponent(url.username), DB_PASSWORD: decodeURIComponent(url.password), JWT_SECRET: "integration-only-" + crypto.randomUUID(), NODE_ENV: "test", DEMO_FLIGHTS_ENABLED: "false", DEMO_PAYMENTS_ENABLED: "true", MOMO_PARTNER_CODE: "TEST", MOMO_ACCESS_KEY: "test-access", MOMO_SECRET_KEY: "test-secret" });
  pool = require("../config/database");
  assert.equal(Number((await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")).rows[0].count), 0, "Use a new empty test database; the suite never deletes existing tables.");
  await pool.query(fs.readFileSync(path.join(__dirname, "fixtures/schema.sql"), "utf8"));
  const { assertSchemaReady } = require("../lib/schema");
  await assert.rejects(assertSchemaReady(pool), /Database migration required/);
  bcrypt = require("bcrypt");
  const hash = await bcrypt.hash("ReviewPassword123", 4);
  await pool.query("INSERT INTO users(full_name,email,password_hash,phone,role) VALUES('Admin Test','admin@example.test',$1,'0900000001','ADMIN'),('Customer Test','test@example.test',$1,'0900000002','CUSTOMER'),('Second Test','second@example.test',$1,'0900000003','CUSTOMER')", [hash]);
  // Enum DDL and the migration body are committed separately.
  const migration = fs.readFileSync(path.join(__dirname, "../migrations/001_account_booking_safety.sql"), "utf8");
  const begin = migration.indexOf("BEGIN;");
  await pool.query(migration.slice(0, begin));
  await pool.query(migration.slice(begin));
  // Reapplying the additive migration must not duplicate metadata.
  await pool.query(migration.slice(0, begin));
  await pool.query(migration.slice(begin));
  await assertSchemaReady(pool);
  await pool.query("INSERT INTO airlines(name,code) VALUES('Test Air','TA')");
  await pool.query("INSERT INTO airports(code,name,city,country) VALUES('HAN','Ha Noi','Ha Noi','Vietnam'),('SGN','Ho Chi Minh','Ho Chi Minh','Vietnam')");
  await pool.query("INSERT INTO airplanes(airline_id,model,seat_capacity) VALUES(1,'Test 1',40),(1,'Test 2',1)");
  await pool.query("INSERT INTO seats(airplane_id,seat_number,class) SELECT 1,n::text,'ECONOMY' FROM generate_series(1,30) n");
  await pool.query("INSERT INTO seats(airplane_id,seat_number,class) VALUES(1,'B1','BUSINESS'),(1,'F1','FIRST'),(2,'X1','ECONOMY')");
  seats = (await pool.query("SELECT * FROM seats ORDER BY id")).rows;
  flightId = (await pool.query("INSERT INTO flights(flight_number,airline_id,airplane_id,departure_airport_id,arrival_airport_id,departure_time,arrival_time,status,price) VALUES('TA001',1,1,1,2,'2080-01-01 06:30','2080-01-01 08:30','AVAILABLE',1000000) RETURNING id")).rows[0].id;
  // Verify removal guards and rollback before running every API test without the legacy tables.
  const cleanup = fs.readFileSync(path.join(__dirname,"../migrations/004_remove_replaced_tables.sql"),"utf8");
  const cleanupClient = await pool.connect();
  try {
    const temp = (await cleanupClient.query("INSERT INTO booking_temp(user_id,flight_id,seat_id,seat_class,price,expired_at) VALUES(2,$1,$2,'ECONOMY',1000000,LOCALTIMESTAMP+interval '15 minutes') RETURNING id",[flightId,seats[0].id])).rows[0];
    await assert.rejects(cleanupClient.query(cleanup), /booking_temp is not empty/);
    await cleanupClient.query("ROLLBACK");
    assert.equal(Number((await cleanupClient.query("SELECT count(*) FROM booking_temp")).rows[0].count),1);
    await cleanupClient.query("DELETE FROM booking_temp WHERE id=$1",[temp.id]);
    await cleanupClient.query("INSERT INTO password_resets(user_id,reset_code,expires_at) VALUES(2,'123456',LOCALTIMESTAMP+interval '1 hour')");
    await assert.rejects(cleanupClient.query(cleanup), /unexpired legacy codes/);
    await cleanupClient.query("ROLLBACK");
    await cleanupClient.query("UPDATE password_resets SET expires_at=LOCALTIMESTAMP-interval '1 minute'");
    await cleanupClient.query("CREATE VIEW test_legacy_reset_dependency AS SELECT user_id FROM password_resets");
    await assert.rejects(cleanupClient.query(cleanup), e => e.code === '2BP01');
    await cleanupClient.query("ROLLBACK");
    assert.notEqual((await cleanupClient.query("SELECT to_regclass('public.booking_temp') AS name")).rows[0].name,null);
    await cleanupClient.query("DROP VIEW test_legacy_reset_dependency");
    await cleanupClient.query(cleanup);
    await cleanupClient.query(cleanup);
    const removed = (await cleanupClient.query("SELECT to_regclass('public.booking_temp') AS temp,to_regclass('public.password_resets') AS resets,to_regclass('public.booking_temp_id_seq') AS temp_seq,to_regclass('public.password_resets_id_seq') AS resets_seq")).rows[0];
    assert.deepEqual(removed,{temp:null,resets:null,temp_seq:null,resets_seq:null});
    for (const table of ['passengers','tickets','notifications']) {
      assert.notEqual((await cleanupClient.query('SELECT to_regclass($1) AS name',[`public.${table}`])).rows[0].name,null);
    }
  } catch (error) { await cleanupClient.query("ROLLBACK"); throw error; }
  finally { cleanupClient.release(); }
  await assertSchemaReady(pool);
  const mailPath = require.resolve("../services/email.service");
  require.cache[mailPath] = { id: mailPath, filename: mailPath, loaded: true, exports: { sendPasswordCode: async info => { delivered.push(info); }, sendPaymentSuccessEmail: async () => {} } };
  const momo = require("../services/momo.service");
  momo.createMomoPayment = async args => { momoCreates++; return { ...args, payUrl: "https://example.test/pay/" + args.orderId }; };
  const express = require("express");
  const app = express();
  app.use(express.json());
  for (const name of ["auth", "user", "flight", "seat", "booking", "payment"]) {
    const route = { user: "users", flight: "flights", seat: "seats", booking: "bookings", payment: "payments" }[name] || name;
    app.use(`/api/${route}`, require(`../routes/${name}.routes`));
  }
  app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: err.message }); });
  server = await new Promise(resolve => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  base = `http://127.0.0.1:${server.address().port}`;
  const login = async email => {
    const result = await request("/api/auth/login", { method: "POST", body: { email, password: "ReviewPassword123" } });
    assert.equal(result.status, 200);
    return result.data.token;
  };
  adminToken = await login("admin@example.test");
  customerToken = await login("test@example.test");
  secondToken = await login("second@example.test");
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (pool) await pool.end();
});
const check = (name, fn) => test(name, { skip: !enabled }, fn);

check("locked accounts immediately lose previously issued tokens; unlocking does not revive them", async () => {
  assert.equal((await request("/api/users/3/toggle-lock", { token: adminToken, method: "PUT", body: { is_locked: true } })).status, 200);
  assert.equal((await request("/api/users/profile", { token: secondToken })).status, 401);
  await request("/api/users/3/toggle-lock", { token: adminToken, method: "PUT", body: { is_locked: false } });
  assert.equal((await request("/api/users/profile", { token: secondToken })).status, 401);
  secondToken = (await request("/api/auth/login", { method: "POST", body: { email: "second@example.test", password: "ReviewPassword123" } })).data.token;
  assert.equal((await request("/api/users", { token: secondToken })).status, 403);
});

check("primary admin cannot be locked, demoted, or deleted", async () => {
  for (const [url, method, body] of [["/api/users/1/toggle-lock","PUT",{ is_locked: true }],["/api/users/1/role","PUT",{ role: "CUSTOMER" }],["/api/users/1","DELETE",undefined]]) {
    assert.equal((await request(url, { token: adminToken, method, body })).status, 403);
  }
});

check("forgot-password emails a one-time code, limits guesses, consumes codes and revokes tokens", async () => {
  const first = await request("/api/auth/forgot-password", { method: "POST", body: { email: "second@example.test" } });
  assert.equal(first.status, 200);
  assert.equal(first.data.code, undefined);
  assert.equal(delivered.length, 1);
  const code = delivered[0].code;
  assert.equal((await request("/api/auth/forgot-password", { method: "POST", body: { email: "second@example.test" } })).status, 429);
  const wrongCode = code === "111111" ? "222222" : "111111";
  for (let i = 0; i < 5; i++) assert.equal((await request("/api/auth/reset-password", { method: "POST", body: { email: "second@example.test", code: wrongCode, newPassword: "NewPassword123" } })).status, 400);
  assert.equal((await request("/api/auth/reset-password", { method: "POST", body: { email: "second@example.test", code, newPassword: "NewPassword123" } })).status, 400);
  await pool.query("UPDATE password_challenges SET created_at=now()-interval '2 minutes' WHERE user_id=3");
  await request("/api/auth/forgot-password", { method: "POST", body: { email: "second@example.test" } });
  const newCode = delivered.at(-1).code;
  assert.equal((await request("/api/auth/reset-password", { method: "POST", body: { email: "second@example.test", code: newCode, newPassword: "NewPassword123" } })).status, 200);
  assert.equal((await request("/api/users/profile", { token: secondToken })).status, 401);
  assert.equal((await request("/api/auth/reset-password", { method: "POST", body: { email: "second@example.test", code: newCode, newPassword: "AnotherPassword123" } })).status, 400);
  secondToken = (await request("/api/auth/login", { method: "POST", body: { email: "second@example.test", password: "NewPassword123" } })).data.token;
});

check("two users racing for the same seat produce one successful hold", async () => {
  const results = await Promise.all([hold(seats[0].id), hold(seats[0].id, secondToken)]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  assert.equal(Number((await pool.query("SELECT count(*) FROM booking_details WHERE flight_id=$1 AND seat_id=$2 AND seat_status='HOLD'", [flightId, seats[0].id])).rows[0].count), 1);
});

check("cannot hold a seat from another airplane, or book a cancelled/departed flight", async () => {
  assert.equal((await hold(seats.find(s => s.seat_number === "X1").id)).status, 404);
  await pool.query("UPDATE flights SET status='CANCELLED' WHERE id=$1", [flightId]);
  assert.equal((await hold(seats[1].id)).status, 409);
  await pool.query("UPDATE flights SET status='AVAILABLE',departure_time='2000-01-01 06:30' WHERE id=$1", [flightId]);
  assert.equal((await hold(seats[1].id)).status, 409);
  await pool.query("UPDATE flights SET departure_time='2080-01-01 06:30' WHERE id=$1", [flightId]);
});

check("business/first price and flight snapshots are derived from DB, not the request", async () => {
  for (const [seatNumber, price] of [["B1",1500000],["F1",2000000]]) {
    const result = await booking(seats.find(s => s.seat_number === seatNumber).id, customerToken, { flight_number: "FORGED", departure_place: "FAKE", seat_number: "FAKE", price: 1 });
    assert.equal(result.status, 200);
    assert.equal(result.data.pricing.seat_fare, price);
    assert.equal(result.data.booking.departure_place, "HAN");
    assert.equal(result.data.booking.flight_number_snapshot, "TA001");
    assert.equal(result.data.booking.seat_number_snapshot, seatNumber);
  }
  const bad = await booking(seats[2].id, customerToken, { passenger: { ...passenger, phone: "bad", document_number: "" } });
  assert.equal(bad.status, 400);
});

check("mock payment rejects incomplete or expired bookings and is disabled outside demo", async () => {
  const held = await hold(seats[3].id);
  assert.equal((await request(`/api/bookings/${held.data.booking_id}/pay`, { token: customerToken, method: "POST" })).status, 409);
  const b = await booking(seats[3].id);
  process.env.DEMO_PAYMENTS_ENABLED = "false";
  assert.equal((await request('/api/payments/config')).data.demo_payments_enabled, false);
  assert.equal((await request(`/api/bookings/${b.data.booking.id}/pay`, { token: customerToken, method: "POST" })).status, 403);
  process.env.DEMO_PAYMENTS_ENABLED = "true";
  process.env.NODE_ENV = "production";
  try {
    assert.equal((await request('/api/payments/config')).data.demo_payments_enabled, false);
    assert.equal((await request(`/api/bookings/${b.data.booking.id}/pay`, { token: customerToken, method: "POST" })).status, 403);
  } finally { process.env.NODE_ENV = "test"; }
  assert.equal((await request('/api/payments/config')).data.demo_payments_enabled, true);
  await pool.query("UPDATE booking_details SET hold_expires_at=LOCALTIMESTAMP-interval '1 second' WHERE booking_id=$1", [b.data.booking.id]);
  assert.equal((await request(`/api/bookings/${b.data.booking.id}/pay`, { token: customerToken, method: "POST" })).status, 409);
});

check("successful mock transactions do not contribute to real dashboard revenue", async () => {
  const b = await booking(seats[4].id);
  assert.equal((await request(`/api/bookings/${b.data.booking.id}/pay`, { token: customerToken, method: "POST" })).status, 200);
  const repeated = await request(`/api/bookings/${b.data.booking.id}/pay`, { token: customerToken, method: "POST" });
  assert.equal(repeated.status, 200);
  assert.equal(repeated.data.already, true);
  const state = (await request(`/api/payments/booking/${b.data.booking.id}/status`, { token: customerToken })).data;
  assert.equal(state.booking.status, 'CONFIRMED');
  assert.equal(state.payments.length, 1);
  assert.equal(state.payments[0].method, 'MOCK');
  assert.equal(state.payments[0].status, 'SUCCESS');
  const seatState = (await pool.query('SELECT seat_status,hold_expires_at FROM booking_details WHERE booking_id=$1',[b.data.booking.id])).rows[0];
  assert.equal(seatState.seat_status,'BOOKED');
  assert.equal(seatState.hold_expires_at,null);
  const tickets = (await request('/api/bookings/my-tickets',{token:customerToken})).data.data;
  assert.equal(tickets.find(t=>t.id===b.data.booking.id).payment_method,'MOCK');
  const stats = await request("/api/flights/overview", { token: adminToken });
  assert.equal(stats.status, 200);
  assert.equal(Number(stats.data.revenue), 0);
  assert.equal((await request("/api/users/2", { token: adminToken, method: "DELETE" })).status, 409);
});

check("MoMo attempts are reused while pending; callback validates signature/amount and is idempotent", async () => {
  const b = (await booking(seats[5].id)).data.booking;
  const count = momoCreates;
  const created = await attempt(b.id);
  assert.equal(created.status, 200);
  assert.equal((await attempt(b.id)).data.orderId, created.data.orderId);
  assert.equal(momoCreates, count + 1);
  const success = ipnBody(created.data, b.id);
  assert.equal((await request("/api/payments/momo/ipn", { method: "POST", body: { ...success, signature: "invalid" } })).status, 400);
  const wrong = ipnBody(created.data, b.id, 0, { amount: 1 }); // Valid signature, wrong amount.
  assert.equal((await request("/api/payments/momo/ipn", { method: "POST", body: wrong })).status, 400);
  assert.equal((await request("/api/payments/momo/ipn", { method: "POST", body: success })).status, 200);
  assert.equal((await request("/api/payments/momo/ipn", { method: "POST", body: success })).status, 200);
  assert.equal((await request("/api/payments/momo/ipn", { method: "POST", body: ipnBody(created.data, b.id, 1006) })).status, 200);
  assert.equal((await pool.query("SELECT status FROM payments WHERE booking_id=$1", [b.id])).rows[0].status, "SUCCESS");
  assert.equal((await request(`/api/payments/booking/${b.id}/status`, { token: secondToken })).status, 404);
});

check("payment arriving after seat expiry/reallocation is captured for review, without taking another user's seat", async () => {
  const b = (await booking(seats[6].id)).data.booking;
  const created = await attempt(b.id);
  await pool.query("UPDATE booking_details SET hold_expires_at=LOCALTIMESTAMP-interval '1 second' WHERE booking_id=$1", [b.id]);
  const next = await hold(seats[6].id, secondToken);
  assert.equal(next.status, 200);
  const response = await request("/api/payments/momo/ipn", { method: "POST", body: ipnBody(created.data, b.id) });
  assert.equal(response.status, 200);
  assert.equal(response.data.review, true);
  const state = (await request(`/api/payments/booking/${b.id}/status`, { token: customerToken })).data;
  assert.equal(state.booking.status, "PAYMENT_REVIEW");
  assert.equal(state.payments[0].status, "SUCCESS");
  assert.equal(state.reviews.length, 1);
  const owned = (await pool.query("SELECT booking_id FROM booking_details WHERE seat_id=$1 AND seat_status='HOLD'", [seats[6].id])).rows[0];
  assert.equal(owned.booking_id, next.data.booking_id);
  const reviewId = state.reviews[0].id;
  assert.equal((await request(`/api/payments/reviews/${reviewId}/refund`, { token: adminToken, method: "POST", body: { note: "Refund verified", refund_reference: "TEST_REFUND" } })).status, 200);
  assert.equal((await request(`/api/payments/booking/${b.id}/status`, { token: customerToken })).data.payments[0].status, "REFUNDED");
});

check("search is read-only, paginated, excludes unavailable flights, and preserves Vietnam clock time", async () => {
  const before = Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count);
  const empty = await request("/api/flights/search?from=SGN&to=HAN&date=2080-02-01");
  assert.equal(empty.status, 200);
  assert.equal(empty.data.total, 0);
  assert.equal(Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count), before);
  const found = await request("/api/flights/search?from=HAN&to=SGN&date=2080-01-01&page_size=1");
  assert.equal(found.data.data[0].departure_time, "06:30");
  assert.equal(found.data.page_size, 1);
  assert.equal((await request("/api/flights/search?from=HAN&to=SGN&date=2080-02-31")).status, 400);
});

check("a second captured attempt is reviewed and refunding it leaves the original ticket paid", async () => {
  const b = (await booking(seats[8].id)).data.booking;
  const first = (await attempt(b.id)).data;
  await request("/api/payments/momo/ipn", { method: "POST", body: ipnBody(first, b.id, 1006) });
  const second = (await attempt(b.id)).data;
  assert.notEqual(second.orderId, first.orderId);
  assert.equal((await request("/api/payments/momo/ipn", { method: "POST", body: ipnBody(first, b.id) })).status, 200);
  const extra = await request("/api/payments/momo/ipn", { method: "POST", body: ipnBody(second, b.id) });
  assert.equal(extra.data.review, true);
  const state = (await request(`/api/payments/booking/${b.id}/status`, { token: customerToken })).data;
  assert.equal(state.booking.status, "CONFIRMED");
  const review = state.reviews.find(r => r.status === "OPEN");
  const refund = { token: adminToken, method: "POST", body: { note: "Duplicate payment refunded", refund_reference: "TEST_DUPLICATE" } };
  assert.equal((await request(`/api/payments/reviews/${review.id}/refund`, refund)).status, 200);
  assert.equal((await request(`/api/payments/reviews/${review.id}/refund`, refund)).status, 200);
  const tickets = (await request("/api/bookings/my-tickets", { token: customerToken })).data.data;
  assert.equal(tickets.find(t => t.id === b.id).payment_status, "SUCCESS");
  assert.equal((await request(`/api/payments/booking/${b.id}/status`, { token: customerToken })).data.booking.status, "CONFIRMED");
});

check("flight validation prevents overlapping schedules, wrong airlines and changing a booked airplane", async () => {
  const flight = { flight_number: "TA002", airline_id: 1, airplane_id: 1, departure_airport_id: 1, arrival_airport_id: 2, departure_time: "2080-01-01T07:00", arrival_time: "2080-01-01T09:00", price: 1000000, status: "AVAILABLE" };
  assert.equal((await request("/api/flights", { token: adminToken, method: "POST", body: flight })).status, 409);
  assert.equal((await request("/api/flights", { token: adminToken, method: "POST", body: { ...flight, airline_id: 999 } })).status, 400);
  assert.equal((await request(`/api/flights/${flightId}`, { token: adminToken, method: "PUT", body: { ...flight, airplane_id: 2 } })).status, 409);
  await pool.query("UPDATE flights SET status='DELAYED' WHERE id=$1", [flightId]);
  assert.equal((await request("/api/flights/search?from=HAN&to=SGN&date=2080-01-01")).data.total, 0);
  assert.equal((await hold(seats[9].id)).status, 409);
  await pool.query("UPDATE flights SET status='AVAILABLE' WHERE id=$1", [flightId]);
});

check("a capture received after admin cancellation goes to review, without confirming the booking", async () => {
  const b = (await booking(seats[10].id)).data.booking;
  const created = (await attempt(b.id)).data;
  assert.equal((await request(`/api/bookings/${b.id}/cancel`, { token: adminToken, method: "POST", body: { reason: "Customer cancellation request" } })).status, 200);
  assert.equal((await request("/api/payments/momo/ipn", { method: "POST", body: ipnBody(created, b.id) })).data.review, true);
  const state = (await request(`/api/payments/booking/${b.id}/status`, { token: customerToken })).data;
  assert.equal(state.booking.status, "PAYMENT_REVIEW");
  assert.equal((await pool.query("SELECT seat_status FROM booking_details WHERE booking_id=$1", [b.id])).rows[0].seat_status, "CANCELLED");
});

check("admin cancellation preserves bookings and payments, opens review, and tickets show current flight status", async () => {
  const before = Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count);
  const result = await request(`/api/flights/${flightId}`, { token: adminToken, method: "DELETE" });
  assert.equal(result.status, 200);
  assert.equal(Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count), before);
  assert.equal((await pool.query("SELECT status FROM flights WHERE id=$1", [flightId])).rows[0].status, "CANCELLED");
  const tickets = await request("/api/bookings/my-tickets", { token: customerToken });
  assert.equal(tickets.status, 200);
  assert.ok(tickets.data.data.length > 0);
  assert.ok(tickets.data.data.every(t => t.current_flight_status === "CANCELLED"));
  assert.equal((await request("/api/bookings/admin", { token: adminToken })).status, 200);
  assert.equal((await request("/api/payments", { token: adminToken })).status, 200);
});

check("data setup removes only unused old demo flights, fills countries and creates 12 planes/240 seats once", async () => {
  await pool.query("INSERT INTO airlines(name,code) VALUES('Demo Vietnam Airlines','VN')");
  await pool.query("INSERT INTO airports(code,name) VALUES('DAD','Da Nang'),('NRT','Narita'),('HND','Haneda'),('SIN','Changi'),('PQC','Phu Quoc'),('CXR','Cam Ranh'),('DLI','Lien Khuong'),('HUI','Phu Bai'),('VCA','Can Tho')");
  await pool.query(fs.readFileSync(path.join(__dirname,"../migrations/002_demo_flight_schedule.sql"),"utf8"));
  await pool.query("UPDATE flights SET demo_key='protected',flight_number='DM20800101-PROTECTED' WHERE id=$1",[flightId]);
  await pool.query("INSERT INTO flights(demo_key,flight_number,airline_id,airplane_id,departure_airport_id,arrival_airport_id,departure_time,arrival_time,status,price) VALUES('unused','DM20900101-UNUSED',1,1,1,2,'2090-01-01 06:00','2090-01-01 08:00','AVAILABLE',1000000)");
  await pool.query("INSERT INTO flights(demo_key,flight_number,airline_id,airplane_id,departure_airport_id,arrival_airport_id,departure_time,arrival_time,status,price) VALUES('snapshot-only','DM20900101-SNAPSHOT',1,1,1,2,'2090-01-01 09:00','2090-01-01 11:00','AVAILABLE',1000000)");
  await pool.query("INSERT INTO bookings(user_id,booking_code,total_price,status,flight_number_snapshot) VALUES(2,'TEST_SNAPSHOT_ONLY',1000000,'PENDING','DM20900101-SNAPSHOT')");
  const setup = fs.readFileSync(path.join(__dirname,"../migrations/003_on_demand_demo_data.sql"),"utf8");
  await pool.query(setup);
  await pool.query(setup);
  assert.equal((await pool.query("SELECT id FROM flights WHERE demo_key='unused'")).rows.length,0);
  assert.equal((await pool.query("SELECT id FROM flights WHERE demo_key='snapshot-only'")).rows.length,1);
  assert.equal((await pool.query("SELECT id FROM flights WHERE id=$1",[flightId])).rows.length,1);
  assert.equal(Number((await pool.query("SELECT count(*) FROM airplanes WHERE model LIKE 'DEMO-A320-%'")).rows[0].count),12);
  assert.equal(Number((await pool.query("SELECT count(*) FROM seats s JOIN airplanes a ON a.id=s.airplane_id WHERE a.model LIKE 'DEMO-A320-%'")).rows[0].count),240);
  const classes = (await pool.query("SELECT s.class,count(*)::int AS count FROM seats s JOIN airplanes a ON a.id=s.airplane_id WHERE a.model='DEMO-A320-01' GROUP BY s.class")).rows;
  assert.deepEqual(Object.fromEntries(classes.map(r=>[r.class,r.count])),{ECONOMY:16,BUSINESS:3,FIRST:1});
  assert.equal((await pool.query("SELECT country FROM airports WHERE code='VCA'")).rows[0].country,"Vietnam");
  assert.equal((await pool.query("SELECT country FROM airports WHERE code='HND'")).rows[0].country,"Japan");
  process.env.DEMO_FLIGHTS_ENABLED="true";
});

check("catalog restricts foreign endpoints to HAN/SGN; forbidden route requests do not insert flights or permit booking", async () => {
  const catalog = (await request("/api/flights/catalog")).data;
  assert.equal(catalog.routes.length,68);
  assert.equal(catalog.routes.filter(r=>r.kind==='DOMESTIC').length,56);
  const before = Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count);
  for(const [from,to] of [["NRT","VCA"],["DAD","SIN"],["SIN","HND"]]) {
    const result = await request(`/api/flights/search?from=${from}&to=${to}&date=2090-04-01`);
    assert.equal(result.status,200);assert.equal(result.data.total,0);
  }
  assert.equal(Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count),before);
  const airports = Object.fromEntries(catalog.airports.map(a=>[a.code,a.id]));
  const forbidden = (await pool.query("INSERT INTO flights(flight_number,airline_id,airplane_id,departure_airport_id,arrival_airport_id,departure_time,arrival_time,status,price) VALUES('OLD_FORBIDDEN',1,1,$1,$2,'2090-04-01 06:00','2090-04-01 14:00','AVAILABLE',5500000) RETURNING id",[airports.DAD,airports.NRT])).rows[0];
  assert.equal((await request("/api/bookings/hold-seat",{token:customerToken,method:"POST",body:{flight_id:forbidden.id,seat_id:seats[20].id}})).status,409);
  assert.equal((await request(`/api/seats/flight/${forbidden.id}`,{token:customerToken})).status,409);
});

check("concurrent searches save exactly one flight; days keep independent seat inventories and fares", async () => {
  const url="/api/flights/search?from=HAN&to=VCA&date=2090-06-01";
  const before = Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count);
  const results=await Promise.all([request(url),request(url),request(url)]);
  assert.ok(results.every(r=>r.status===200 && r.data.total===1));
  assert.equal(Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count),before+1);
  const first=results[0].data.data[0];
  const next=(await request("/api/flights/search?from=HAN&to=VCA&date=2090-06-02")).data.data[0];
  assert.notEqual(first.id,next.id);assert.equal(first.airplane_id,next.airplane_id);
  assert.equal(first.price,1500000);
  const seat=(await pool.query("SELECT id FROM seats WHERE airplane_id=$1 AND class='ECONOMY' ORDER BY id LIMIT 1",[first.airplane_id])).rows[0];
  assert.equal((await request("/api/bookings/hold-seat",{token:customerToken,method:"POST",body:{flight_id:first.id,seat_id:seat.id}})).status,200);
  assert.equal((await request("/api/bookings/hold-seat",{token:secondToken,method:"POST",body:{flight_id:next.id,seat_id:seat.id}})).status,200);
  assert.equal((await request("/api/bookings/hold-seat",{token:secondToken,method:"POST",body:{flight_id:first.id,seat_id:seat.id}})).status,409);
  const booked=await request("/api/bookings",{token:customerToken,method:"POST",body:{flight_id:first.id,seat_id:seat.id,passenger}});
  assert.equal(booked.status,200);assert.equal(Number(booked.data.booking.total_price),1500000);
  assert.equal((await request(`/api/bookings/${booked.data.booking.id}/pay`,{token:customerToken,method:"POST"})).status,200);
  assert.equal((await request(url+"&page=2")).data.total,1);
  assert.equal(Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count),before+2);
});

check("all 68 routes can be searched in reverse order without plane overlaps or pre-generating other dates", async () => {
  const routes=(await request("/api/flights/catalog")).data.routes;
  const before=Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count);
  for(const r of [...routes].reverse()) {
    const result=await request(`/api/flights/search?from=${r.from}&to=${r.to}&date=2091-05-01`);
    assert.equal(result.status,200,`${r.from}-${r.to}: ${JSON.stringify(result.data)}`);
    assert.equal(result.data.total,1,`${r.from}-${r.to}`);
    assert.equal(result.data.data[0].price,r.kind==='DOMESTIC'?1500000:5500000);
  }
  assert.equal(Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count),before+68);
  const overlaps=await pool.query(`SELECT a.id,b.id FROM flights a JOIN flights b ON a.airplane_id=b.airplane_id AND a.id<b.id
    WHERE a.status<>'CANCELLED' AND b.status<>'CANCELLED' AND a.departure_time<b.arrival_time AND b.departure_time<a.arrival_time`);
  assert.equal(overlaps.rows.length,0);
});

check("cancellation and rescheduling are not undone by later searches", async () => {
  const f=(await request("/api/flights/search?from=NRT&to=HAN&date=2091-05-01")).data.data[0];
  assert.equal((await request(`/api/flights/${f.id}`,{token:adminToken,method:"DELETE"})).status,200);
  assert.equal((await request("/api/flights/search?from=NRT&to=HAN&date=2091-05-01")).data.total,0);
  assert.equal((await pool.query("SELECT status FROM flights WHERE id=$1",[f.id])).rows[0].status,'CANCELLED');
  const moved=(await request("/api/flights/search?from=HAN&to=SIN&date=2091-05-01")).data.data[0];
  await pool.query("UPDATE flights SET departure_time=departure_time+interval '1 day',arrival_time=arrival_time+interval '1 day' WHERE id=$1",[moved.id]);
  const before=Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count);
  assert.equal((await request("/api/flights/search?from=HAN&to=SIN&date=2091-05-01")).data.total,0);
  assert.equal((await request("/api/flights/search?from=HAN&to=SIN&date=2091-05-02")).data.data[0].id,moved.id);
  assert.equal(Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count),before);
});

check("sold out flights stay sold out; production and disabled demo searches stay read-only", async () => {
  const f=(await request("/api/flights/search?from=VCA&to=CXR&date=2092-01-01")).data.data[0];
  const seatRows=(await pool.query("SELECT id,class FROM seats WHERE airplane_id=$1",[f.airplane_id])).rows;
  for(const s of seatRows) {
    const b=(await pool.query("INSERT INTO bookings(user_id,booking_code,total_price,status) VALUES(2,$1,1500000,'CONFIRMED') RETURNING id",[`TEST_SOLD_${s.id}`])).rows[0];
    await pool.query("INSERT INTO booking_details(booking_id,flight_id,seat_id,seat_class,price,seat_status) VALUES($1,$2,$3,$4,1500000,'BOOKED')",[b.id,f.id,s.id,s.class]);
  }
  assert.equal((await request("/api/flights/search?from=VCA&to=CXR&date=2092-01-01")).data.total,0);
  const before=Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count);
  process.env.DEMO_FLIGHTS_ENABLED='false';
  assert.equal((await request("/api/flights/search?from=VCA&to=CXR&date=2095-01-01")).data.total,0);
  process.env.DEMO_FLIGHTS_ENABLED='true';process.env.NODE_ENV='production';
  assert.equal((await request("/api/flights/search?from=HAN&to=NRT&date=2095-01-01")).data.total,0);
  process.env.NODE_ENV='test';
  assert.equal(Number((await pool.query("SELECT count(*) FROM flights")).rows[0].count),before);
  for(const url of ['/api/flights/search?from=HAN&to=VCA&date=2000-01-01','/api/flights/search?from=ZZZ&to=VCA&date=2095-01-01']) assert.equal((await request(url)).status,400);
  assert.equal((await request('/api/flights/demo/generate',{token:adminToken,method:'POST',body:{confirm:true}})).status,410);
});

check("admin can remove an unused user and manual flight after legacy tables are gone", async () => {
  const user=(await pool.query("INSERT INTO users(full_name,email,password_hash) SELECT 'Unused Test','unused-delete@example.test',password_hash FROM users WHERE id=2 RETURNING id")).rows[0];
  assert.equal((await request(`/api/users/${user.id}`,{token:adminToken,method:'DELETE'})).status,200);
  assert.equal((await pool.query('SELECT id FROM users WHERE id=$1',[user.id])).rows.length,0);
  const flight=(await pool.query("INSERT INTO flights(flight_number,airline_id,airplane_id,departure_airport_id,arrival_airport_id,departure_time,arrival_time,status,price) VALUES('REMOVABLE',1,2,1,2,'2098-12-01 06:00','2098-12-01 08:00','AVAILABLE',1000000) RETURNING id")).rows[0];
  assert.equal((await request(`/api/flights/${flight.id}`,{token:adminToken,method:'DELETE'})).status,200);
  assert.equal((await pool.query('SELECT id FROM flights WHERE id=$1',[flight.id])).rows.length,0);
});

