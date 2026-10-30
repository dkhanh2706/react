import { test } from "node:test";
import assert from "node:assert/strict";
import { formatNumber, formatMoney, formatDate, formatTime, formatDateTime, vietnamToday } from "../src/utils/format.js";
import { getAuth, getStoredUser, isAdminUser, clearAuthStorage, isTokenExpired } from "../src/utils/auth.js";
import { getGenderName, getMealName } from "../src/utils/labels.js";
import { getInitialPassenger } from "../src/utils/passenger.js";

test("money formatting handles PostgreSQL numeric strings, zero, missing and invalid values", () => {
  assert.equal(formatMoney("1500000"), "1.500.000đ");
  assert.equal(formatMoney(1500000, { suffix: " VNĐ" }), "1.500.000 VNĐ");
  assert.equal(formatNumber(1780000), "1.780.000");
  for (const value of [null, undefined, "invalid", Infinity, NaN, 0]) assert.equal(formatMoney(value), "0đ");
});

test("calendar dates remain unchanged across host timezones and validate leap days", () => {
  assert.equal(formatDate("2000-01-01"), "01/01/2000");
  assert.equal(formatDate("2024-02-29"), "29/02/2024");
  assert.equal(formatDate("2026-02-29"), "---");
  assert.equal(formatDate(null, { fallback: "Chưa cập nhật" }), "Chưa cập nhật");
  assert.equal(formatDate("bad date"), "---");
});

test("UTC and naive database timestamps both display in Vietnam time", () => {
  assert.equal(formatTime("2026-10-28T00:15:00Z"), "07:15");
  assert.equal(formatTime("2026-10-28 07:15:00"), "07:15");
  assert.equal(formatTime(new Date("2026-10-28T00:15:00Z")), "07:15");
  assert.equal(formatDate("2026-10-27T18:00:00Z", { padded: true }), "28/10/2026");
  assert.equal(formatDateTime("2026-10-28T00:15:00Z"), formatDateTime("2026-10-28 07:15:00"));
  assert.ok(!formatDateTime(undefined, { fallback: "—" }).includes("Invalid"));
});

test("time-only snapshots and optional seconds preserve their original clock", () => {
  assert.equal(formatTime("10:05"), "10:05");
  assert.equal(formatTime("10:05:30"), "10:05");
  assert.equal(formatTime("10:05:30", { seconds: true }), "10:05:30");
  assert.equal(formatTime("10:05", { seconds: true }), "10:05:00");
  for (const value of ["99:99", "24:00", "10:99:00", "10:00:99", "invalid", null]) assert.equal(formatTime(value), "--:--");
});

test("Vietnam date constraints roll over at local midnight rather than UTC midnight", () => {
  assert.equal(vietnamToday(new Date("2026-10-27T16:59:59Z")), "2026-10-27");
  assert.equal(vietnamToday(new Date("2026-10-27T17:00:00Z")), "2026-10-28");
});

test("session parsing, passenger defaults and logout share the same account state", () => {
  const values = new Map();
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const events = [];
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key),
  } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { dispatchEvent: event => events.push(event.type) } });
  try {
    assert.deepEqual(getAuth(), { token: null, user: null });
    assert.deepEqual(getStoredUser({}), {});
    for (const invalid of ["broken JSON", "null", "[]", '"text"']) { values.set("user", invalid); assert.equal(getStoredUser(), null); }
    const user = { id: 1, full_name: "Nguyễn Văn Test", phone: "0900000000", email: "test@example.test", role: "ADMIN" };
    values.set("user", JSON.stringify(user)); values.set("token", "test-token");
    assert.deepEqual(getAuth(), { token: "test-token", user });
    assert.equal(isAdminUser(user), true);
    assert.equal(isAdminUser({ role: "CUSTOMER" }), false);
    assert.equal(getInitialPassenger().full_name, user.full_name);
    assert.equal(getInitialPassenger().email, user.email);
    clearAuthStorage();
    assert.deepEqual(getAuth(), { token: null, user: null });
    assert.deepEqual(events, ["auth-changed"]);
  } finally {
    if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor); else delete globalThis.localStorage;
    if (windowDescriptor) Object.defineProperty(globalThis, "window", windowDescriptor); else delete globalThis.window;
  }
});

test("token expiry accepts Unicode payloads and rejects malformed or expired tokens", () => {
  const token = exp => `test.${Buffer.from(JSON.stringify({ exp, name: "Nguyễn Văn Test" })).toString("base64url")}.test`;
  assert.equal(isTokenExpired(token(Math.floor(Date.now() / 1000) + 3600)), false);
  assert.equal(isTokenExpired(token(1)), true);
  assert.equal(isTokenExpired("broken"), true);
  assert.equal(isTokenExpired("a.invalid-payload.c"), true);
});

test("service labels reuse the actual configured meal options", () => {
  assert.equal(getMealName("CHICKEN_RICE"), "Cơm gà");
  assert.equal(getMealName("NONE"), "Không chọn");
  assert.equal(getMealName("OTHER"), "OTHER");
  assert.equal(getGenderName("female"), "Nữ");
  assert.equal(getGenderName("MALE"), "Nam");
  assert.equal(getGenderName("OTHER"), "Khác");
});
