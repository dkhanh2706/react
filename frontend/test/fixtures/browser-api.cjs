const customer = { id: 12, full_name: "Nguyen Van Test", email: "test@example.test", phone: "0900000000", gender: "Nam", birth_date: "2000-01-01", role: "CUSTOMER", avatar_url: null };
const flight = { id: 1, flight_number: "VN-TEST", airline: "Vietnam Airlines", airline_id: 1, airplane_id: 1, departure_airport_id: 1, arrival_airport_id: 2, departure_code: "HAN", arrival_code: "SGN", from: "HAN", to: "SGN", date: "2080-01-01", departure_time: "2080-01-01T10:00:00+07:00", arrival_time: "2080-01-01T12:00:00+07:00", price: 1500000, status: "AVAILABLE", is_sellable: true, has_history: true, total_seats: 20, booked_seats: 1, held_seats: 0 };
const airports = [{ id: 1, code: "HAN", name: "Nội Bài", city: "Hà Nội", country: "Vietnam" }, { id: 2, code: "SGN", name: "Tân Sơn Nhất", city: "TP. Hồ Chí Minh", country: "Vietnam" }];
const catalog = { airports, airlines: [{ id: 1, name: "Vietnam Airlines", code: "VN" }], airplanes: [{ id: 1, airline_id: 1, model: "A320", seat_capacity: 20 }], routes: [{ from: "HAN", to: "SGN", departure_airport_id: 1, arrival_airport_id: 2 }, { from: "SGN", to: "HAN", departure_airport_id: 2, arrival_airport_id: 1 }] };
const passenger = { full_name: customer.full_name, gender: "MALE", date_of_birth: "2000-01-01", document_type: "CCCD", document_number: "123456789012", phone: customer.phone, email: customer.email };
const booking = { id: 77, booking_code: "BKTEST", total_price: 1780000, status: "PENDING", departure_place: "HAN", arrival_place: "SGN", flight_date: flight.date, departure_time_text: "10:00", arrival_time_text: "12:00", seat_number_snapshot: "1A", airline_name: flight.airline, flight_number_snapshot: flight.flight_number, created_at: "2026-10-28T00:15:00Z" };
const services = { baggage_weight: 10, baggage_price: 150000, meal_type: "CHICKEN_RICE", meal_price: 80000, insurance: true, insurance_price: 50000 };
const holdExpires = new Date(Date.now() + 900000).toISOString();
const checkout = { booking, flight, passenger, seat: { id: 1, seat_number: "1A", class: "ECONOMY" }, services, pricing: { base_price: 1500000, total_price: 1780000 }, hold_expires_at: holdExpires };
const payment = { id: 101, booking_id: 77, method: "MOCK", status: "SUCCESS", amount: 1780000, paid_at: booking.created_at };
const users = [{ ...customer, role: "ADMIN", is_primary_admin: true }, { ...customer, id: 13, full_name: "Customer Two", email: "second@example.test", is_locked: false, created_at: booking.created_at }];
let review, reviewedAt, refund;
let session = { id: "12345678-1234-1234-1234-123456789012", secret: "test-secret", status: "bot", version: 0, available: true, updated_at: new Date().toISOString(), messages: [{ id: 1, sender: "bot", text: "Xin chào" }] };
let available = true;
let staffDeleted = false;
const staff = { id: "abcdef12-1234-1234-1234-123456789012", status: "waiting", version: 0, admin_id: null, messages: [{ id: 1, sender: "user", text: "Tôi cần hỗ trợ", created_at: booking.created_at }] };
const calls = [];
const assistantPayloads = [];
// Scripted provider responses for browser tests only. Production interpretation
// is performed by Groq; backend semantic/schema tests and opt-in live checks
// cover that boundary separately.
const { finalizeAssistant, vietnamToday } = require('../../../backend/lib/chatAssistant');
const assistantAirports = [
  ...airports,
  { code: 'DAD', city: 'Đà Nẵng', country: 'Vietnam' },
  { code: 'CXR', city: 'Nha Trang', country: 'Vietnam' },
  { code: 'PQC', city: 'Phú Quốc', country: 'Vietnam' },
];
function assistant(body) {
  assistantPayloads.push(body);
  const draft = { from: '', to: '', date: '', ...body.flightDraft };
  let intent = 'flight_search', reply = 'Mình đã hiểu nhu cầu của bạn.';
  switch (body.message) {
    case 'Tôi muốn tìm chuyến bay mới': Object.assign(draft, { from: '', to: '', date: '' }); break;
    case 'đà nẵng': draft.from = 'DAD'; break;
    case 'Tôi muốn bay tới Hà Nội': draft.to = 'HAN'; break;
    case 'tân sơn nhất': draft.from = 'SGN'; break;
    case 'mai': {
      const date = new Date(`${vietnamToday()}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + 1); draft.date = date.toISOString().slice(0, 10); break;
    }
    case 'tôi không biết đi đâu':
    case 'tôi khoong biết đi đâu': intent = 'recommendation'; draft.to = ''; reply = 'Mình vẫn giữ điểm đi Đà Nẵng. Bạn thích biển, thiên nhiên hay thành phố?'; break;
    case 'biển': intent = 'recommendation'; reply = 'Bạn có thể cân nhắc Phú Quốc, Nha Trang. Bạn muốn chọn điểm đến nào?'; break;
    case 'DAD': draft.to = 'DAD'; break;
    case 'Hà Nội': draft.to = 'HAN'; break;
    case '03/11/2080': draft.date = '2080-11-03'; break;
    case 'tui muốn 1 chuyến bay từ đà nẵng về tp hcm vào ngày 3/11/2080': Object.assign(draft, { from: 'DAD', to: 'SGN', date: '2080-11-03' }); break;
    case 'đổi sang ngày 5/11': draft.date = '2080-11-05'; break;
    case 'đổi điểm đến sang Hà Nội': draft.to = 'HAN'; break;
    case 'Tìm chuyến bay từ DAD đến SGN ngày 2080-11-06': Object.assign(draft, { from: 'DAD', to: 'SGN', date: '2080-11-06' }); break;
    case 'đổi sang ngày 31/02/2080': draft.date = '2080-02-31'; break;
    case '6/11/2080': draft.date = '2080-11-06'; break;
    case 'abcxyz': break;
    default: intent = 'general'; reply = 'Mock AI reply';
  }
  return finalizeAssistant({ intent, reply,
    updates: Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value || null])),
    clearFields: Object.keys(draft).filter(key => draft[key] === ''), newSearch: false,
  }, assistantAirports, body.flightDraft || { from: '', to: '', date: '' });
}
function token() { return `test.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 86400 })).toString("base64url")}.test`; }
function order() { return { ...booking, hold_expires_at: holdExpires, can_pay: booking.status === "PENDING", payment_status: booking.status === "PENDING" ? "PENDING" : payment.status, payment_method: "MOCK" }; }
function ticket() { return { ...booking, ...passenger, ...services, payment_status: payment.status, payment_method: payment.method, seat_class: "ECONOMY", price: 1500000, seat_status: "BOOKED", current_flight_status: flight.status, current_flight_date: flight.date, current_departure_clock: "10:00", current_arrival_clock: "12:00", current_departure_code: "HAN", current_arrival_code: "SGN" }; }
function adminBooking() { return { ...booking, customer_name: customer.full_name, customer_email: customer.email, details: [{ id: 1, ...passenger, ...services, flight_number: flight.flight_number, seat_class: "ECONOMY", seat_number: "1A", departure_time: flight.departure_time, arrival_time: flight.arrival_time, flight_status: flight.status }], payments: [payment], reviews: refund ? [refund] : [] }; }
function adminPayment() { return { ...booking, ...passenger, ...services, payment_id: payment.id, booking_id: booking.id, booking_status: booking.status, booking_date: booking.created_at, customer_name: customer.full_name, customer_email: customer.email, customer_phone: customer.phone, payment_status: payment.status, payment_method: payment.method, payment_amount: payment.amount, paid_at: payment.paid_at, seat_class: "ECONOMY", review_id: refund?.id, review_status: refund?.status, review_reason: refund?.reason, refund_reference: refund?.refund_reference, resolution_note: refund?.resolution_note }; }
function api(url, method, raw) {
  const p = new URL(url).pathname;
  let body = {}; try { body = JSON.parse(raw || "{}"); } catch { /* Multipart is not used by these smoke checks. */ }
  calls.push({ path: p, method });
  if (p.endsWith("/auth/login")) return { token: token(), user: { ...customer, role: body.email.startsWith("admin") ? "ADMIN" : "CUSTOMER" } };
  if (p.endsWith("/auth/register") || p.endsWith("/auth/forgot-password") || p.endsWith("/auth/reset-password")) return { message: "Thành công" };
  if (p.endsWith("/users/profile")) { if (method === "PUT") Object.assign(customer, body); return { user: customer }; }
  if (p.includes("/password/")) return { message: "Thành công" };
  if (p.endsWith("/toggle-lock")) { users[1].is_locked = !users[1].is_locked; return { user: users[1] }; }
  if (p.endsWith("/users")) return users;
  if (p.endsWith("/flights/catalog")) return catalog;
  if (p.endsWith("/flights/search")) return { data: [flight], total: 1, total_pages: 1 };
  if (p === "/api/flights/1" && method === "GET") return { data: flight };
  if (p.endsWith("/flights/demo/config")) return { enabled: false };
  if (p.endsWith("/flights/overview")) return { flight_count: 1, user_count: 2, revenue: 0, offered_seats: 20, booked_seats: 1 };
  if (p.endsWith("/flights/statistics")) {
    const query = new URL(url).searchParams, from = query.get("from"), to = query.get("to"), group = query.get("group") || "day";
    return { range: { from, to, group }, updated_at: new Date().toISOString(),
      summary: { flight_count: 1, available_flights: 1, delayed_flights: 0, cancelled_flights: 0, offered_seats: 20, booked_seats: 1, held_seats: 2, empty_seats: 17, occupancy_rate: 5, momo_revenue: 1500000, mock_revenue: 1780000, confirmed_value: 1780000, pending_value: 1500000, projected_sales: 3280000 },
      revenue_series: [{ period: from, momo: 1500000, mock: 1780000 }],
      flight_series: [{ period: from, total: 1, available: 1, delayed: 0, cancelled: 0, other: 0 }],
      flights: [{ ...flight, departure_date: from, departure_clock: "10:00", held_seats: 2, empty_seats: 17, occupancy_rate: 5, confirmed_value: 1780000, pending_value: 1500000 }],
    };
  }
  if (p === "/api/flights/1/cancel") { flight.status = "CANCELLED"; return { message: "Đã hủy chuyến" }; }
  if (p.endsWith("/flights")) return { data: [flight] };
  if (p.includes("/seats/flight/")) return { data: [{ id: 1, seat_number: "1A", class: "ECONOMY", status: "AVAILABLE" }, { id: 2, seat_number: "2A", class: "BUSINESS", status: "AVAILABLE" }, { id: 3, seat_number: "3A", class: "FIRST", status: "AVAILABLE" }] };
  if (p.endsWith("/bookings/hold-seat")) return { booking_id: 77, hold_expires_at: holdExpires };
  if (p.endsWith("/bookings/mine")) return { data: [order()] };
  if (p.endsWith("/bookings/my-tickets")) return { data: [ticket()] };
  if (p.endsWith("/bookings/admin")) return { data: [adminBooking()] };
  if (p === "/api/bookings/77/cancel") { Object.assign(booking, { status: "PAYMENT_REVIEW", cancellation_reason: body.reason, cancelled_at: new Date().toISOString() }); refund = { id: 201, payment_id: 101, booking_id: 77, status: "OPEN", reason: body.reason }; return { message: "Đã hủy đơn" }; }
  if (p.endsWith("/bookings")) return checkout;
  if (p.endsWith("/checkout")) return checkout;
  if (p.endsWith("/payments/config")) return { demo_payments_enabled: true };
  if (p.endsWith("/pay")) { booking.status = "CONFIRMED"; return { booking, payment }; }
  if (p.endsWith("/refund")) { Object.assign(refund, { status: "REFUNDED", refund_reference: body.refund_reference, resolution_note: body.note }); payment.status = "REFUNDED"; booking.status = "CANCELLED"; return { message: "Đã ghi nhận hoàn tiền" }; }
  if (p.endsWith("/payments")) return { data: [adminPayment()] };
  if (p.endsWith("/status")) return { booking, payments: [payment], reviews: refund ? [refund] : [] };
  if (p.endsWith("/reviews/mine")) return { data: reviewedAt ? [{ ...review, booking_id: 77, customer_reviewed_at: reviewedAt }] : [] };
  if (p === "/api/reviews/77" && method === "POST") { reviewedAt = new Date().toISOString(); review = { id: 301, ...body, created_at: reviewedAt, name: customer.full_name }; return { data: review }; }
  if (p === "/api/reviews/301" && method === "DELETE") { review = null; return { message: "Đã xóa" }; }
  if (p.endsWith("/reviews")) return { data: review ? [review] : [] };
  if (p.endsWith("/chat/admin/state")) { if (typeof body.available === "boolean") available = body.available; return { available, adminId: 12, conversations: staffDeleted ? [] : [{ ...staff, unread: 1, last_message: staff.messages.at(-1).text }] }; }
  if (p.includes(`/chat/admin/${staff.id}`)) {
    if (body.action === "delete") { staffDeleted = true; staff.messages = []; return { deleted: true, id: staff.id }; }
    if (body.action === "accept") Object.assign(staff, { status: "active", admin_id: 12 });
    if (body.action === "send") staff.messages.push({ id: staff.messages.length + 1, sender: "admin", text: body.text, created_at: new Date().toISOString() });
    if (body.action === "end") staff.status = "ended";
    return staff;
  }
  if (p.endsWith("/chat/reset")) { session = { ...session, id: require("node:crypto").randomUUID(), secret: require("node:crypto").randomUUID(), status: "bot", version: 0, updated_at: new Date().toISOString(), messages: [{ id: 1, sender: "bot", text: "Xin chào" }] }; return session; }
  if (p.endsWith("/chat/session")) {
    session = { ...session, id: require("node:crypto").randomUUID(), secret: require("node:crypto").randomUUID(),
      status: "bot", version: 0, updated_at: new Date().toISOString(), messages: [{ id: 1, sender: "bot", text: "Xin chào" }] };
    return session;
  }
  if (p.endsWith("/chat/sync")) return session;
  if (p.endsWith("/chat/messages") || p.endsWith("/chat/bot")) { session = { ...session, status: p.endsWith("/messages") && session.status !== "active" ? "waiting" : session.status, updated_at: new Date().toISOString(), messages: [...session.messages, { id: session.messages.length + 1, sender: p.endsWith("/bot") ? "bot" : "user", text: body.text }] }; return session; }
  if (p.endsWith("/chat")) return body.mode === 'assistant' ? assistant(body) : { reply: "Mock AI reply" };
  return { data: [] };
}
module.exports = { customer, flight, api, calls, token, assistantPayloads, failNext: new Map() };
