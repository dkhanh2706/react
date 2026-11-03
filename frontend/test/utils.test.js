import { test } from "node:test";
import assert from "node:assert/strict";
import { formatNumber, formatMoney, formatDate, formatTime, formatDateTime, vietnamToday } from "../src/utils/format.js";
import { getAuth, getAuthOwner, getStoredUser, isAdminUser, clearAuthStorage, isTokenExpired, getLoginReturnTarget, saveLoginReturnTarget, readLoginReturnTarget } from "../src/utils/auth.js";
import { clearBookingDraft, readBookingDraft, saveBookingDraft } from "../src/utils/bookingDraft.js";
import { getFlightSearchPath } from "../src/utils/booking.js";
import { getGenderName, getMealName } from "../src/utils/labels.js";
import { getInitialPassenger, passengerFromProfile } from "../src/utils/passenger.js";
import { validateRegistration } from "../src/utils/registration.js";
import { normalizeAirport, normalizeDate } from "../src/utils/chatFlightInput.js";
import { validateChatFlight } from "../src/utils/chatFlightSearch.js";
import { clearChatSearch, readChatSearch, saveChatSearch } from "../src/utils/chatSearchState.js";

test("chat airport input accepts known cities and codes without treating conversation as a destination", () => {
  for (const [input, code] of [["đà nẵng", "DAD"], [" TP.HCM ", "SGN"], ["HAN", "HAN"], ["singapore", "SIN"]]) {
    assert.equal(normalizeAirport(input), code);
  }
  for (const input of ["tôi không biết đi đâu", "tôi khoong biết đi đâu", "biển", "abcxyz", "XYZ", "constructor", "toString", null, 123]) {
    assert.equal(normalizeAirport(input), "");
  }
});

test("passenger profiles map account gender and calendar birth dates without inventing missing data", () => {
  for (const [gender, expected] of [["Nữ", "FEMALE"], ["Nam", "MALE"], ["Khác", "OTHER"], ["FEMALE", "FEMALE"], [undefined, ""], ["invalid", ""]]) {
    const passenger = passengerFromProfile({ gender, birth_date: "2000-02-29", full_name: "Nguyen Test", phone: "0900000000" });
    assert.equal(passenger.gender, expected);
    assert.equal(passenger.date_of_birth, "2000-02-29");
    assert.equal(passenger.document_number, "");
  }
  assert.equal(passengerFromProfile(null).date_of_birth, "");
});

test("registration checks required profile, real calendar dates and matching password confirmation", () => {
  const form = { full_name: "Nguyễn Thị Test", email: "test@example.test", phone: "0900000000", birth_date: "2000-02-29", gender: "Nữ", password: "Password123!", confirm_password: "Password123!" };
  assert.deepEqual(validateRegistration(form), {});
  for (const [name, value] of [["birth_date", "2001-02-29"], ["birth_date", "2999-01-01"], ["confirm_password", "different"], ["gender", ""], ["email", "test@gmail.con"]]) assert.ok(validateRegistration({ ...form, [name]: value })[name]);
  assert.equal(Object.keys(validateRegistration(Object.fromEntries(Object.keys(form).map(key => [key, ""])))).length, 7);
});

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
    assert.equal(getAuthOwner(), "user:1");
    assert.equal(isAdminUser(user), true);
    assert.equal(isAdminUser({ role: "CUSTOMER" }), false);
    assert.equal(getInitialPassenger().full_name, user.full_name);
    assert.equal(getInitialPassenger().email, user.email);
    clearAuthStorage();
    assert.deepEqual(getAuth(), { token: null, user: null });
    assert.equal(getAuthOwner(), "guest");
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

test("flight link validation rejects invalid dates and duplicate airports", () => {
  const today = "2026-11-02", draft = { from: "DAD", to: "SGN", date: "2026-11-03" };
  assert.equal(validateChatFlight(draft, today), "");
  for (const value of ["31/02/2030", "2030-99-99", "2026-02-29"]) assert.equal(normalizeDate(value), "");
  assert.equal(normalizeDate("29/02/2028"), "2028-02-29");
  assert.match(validateChatFlight({ ...draft, date: "2026-11-01" }, today), /ngày đã qua/);
  assert.match(validateChatFlight({ ...draft, to: "DAD" }, today), /không được trùng/);
});

test("login return target preserves the selected flight and rejects external redirects", () => {
  const target = { pathname: "/passenger-info", state: { flight: { id: 123 } } };
  assert.deepEqual(getLoginReturnTarget(target), { ...target, search: "" });
  for (const pathname of ["https://evil.example", "//evil.example", "/\\\\evil.example", "/login", "/register"]) assert.equal(getLoginReturnTarget({ pathname }), null);
});

test("expired sessions retain checkout context only for the same account and within the return deadline", () => {
  const values = new Map();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: {
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key),
  } });
  try {
    const target = { pathname: "/payment", search: "?bookingId=77" };
    saveLoginReturnTarget(target, 12);
    assert.deepEqual(readLoginReturnTarget({ id: 12 }), { ...target, state: undefined });
    assert.equal(readLoginReturnTarget({ id: 13 }), null);
    const saved = JSON.parse(values.get("login-return"));
    values.set("login-return", JSON.stringify({ ...saved, savedAt: Date.now() - 31 * 60 * 1000 }));
    assert.equal(readLoginReturnTarget({ id: 12 }), null);
    saveLoginReturnTarget({ pathname: "//external.example" }, 12);
    assert.equal(readLoginReturnTarget({ id: 12 }), null);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "sessionStorage", descriptor); else delete globalThis.sessionStorage;
  }
});

test("booking drafts survive a return to passenger details without crossing accounts, flights or expiry", () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const draft = { flight: { id: 9 }, passenger: { document_number: "123456789012" }, services: { baggage_weight: 20, insurance: true } };
  saveBookingDraft(draft, storage, "user:12", 1000);
  assert.deepEqual(readBookingDraft(9, storage, "user:12", 1001)?.passenger, draft.passenger);
  assert.equal(readBookingDraft(9, storage, "user:13", 1001), null);
  assert.equal(readBookingDraft(10, storage, "user:12", 1001), null);
  assert.equal(readBookingDraft(9, storage, "user:12", 1000 + 31 * 60 * 1000), null);
  saveBookingDraft(draft, storage, "user:12", 1000);
  clearBookingDraft(9, storage, "user:12");
  assert.equal(readBookingDraft(9, storage, "user:12", 1001), null);
  assert.equal(getFlightSearchPath({ from: "HAN", to: "SGN", date: "2080-01-01" }), "/flights?from=HAN&to=SGN&date=2080-01-01&source=home");
  assert.equal(getFlightSearchPath(null), "/destinations");
});

test("chat restores the chosen route after reload without mixing sessions or keeping expired dates", () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const flightData = { from: 'SGN', to: 'HAN', date: '2080-11-03' };
  saveChatSearch('session-1', flightData, 'done', storage);
  assert.deepEqual(readChatSearch(storage, { id: 'session-1' }, '2026-11-02'), { flightData, step: 'done' });
  assert.equal(readChatSearch(storage, { id: 'session-2' }, '2026-11-02').flightData.from, '');
  const expired = readChatSearch(storage, { id: 'session-1' }, '2080-11-04');
  assert.deepEqual(expired, { flightData: { ...flightData, date: '' }, step: 'date' });
  clearChatSearch(storage);
  assert.equal(readChatSearch(storage, { id: 'session-1' }, '2026-11-02').step, 'idle');
});
