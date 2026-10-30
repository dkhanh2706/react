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
const staff = { id: "abcdef12-1234-1234-1234-123456789012", status: "waiting", version: 0, admin_id: null, messages: [{ id: 1, sender: "user", text: "Tôi cần hỗ trợ", created_at: booking.created_at }] };
const calls = [];
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
  if (p.endsWith("/flights/demo/config")) return { enabled: false };
  if (p.endsWith("/flights/overview")) return { flight_count: 1, user_count: 2, revenue: 0, offered_seats: 20, booked_seats: 1 };
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
  if (p.endsWith("/chat/admin/state")) { if (typeof body.available === "boolean") available = body.available; return { available, adminId: 12, conversations: [{ ...staff, unread: 1, last_message: staff.messages.at(-1).text }] }; }
  if (p.includes(`/chat/admin/${staff.id}`)) {
    if (body.action === "accept") Object.assign(staff, { status: "active", admin_id: 12 });
    if (body.action === "send") staff.messages.push({ id: staff.messages.length + 1, sender: "admin", text: body.text, created_at: new Date().toISOString() });
    if (body.action === "end") staff.status = "ended";
    return staff;
  }
  if (p.endsWith("/chat/session") || p.endsWith("/chat/sync")) return session;
  if (p.endsWith("/chat/messages") || p.endsWith("/chat/bot")) { session = { ...session, updated_at: new Date().toISOString(), messages: [...session.messages, { id: session.messages.length + 1, sender: p.endsWith("/bot") ? "bot" : "user", text: body.text }] }; return session; }
  if (p.endsWith("/chat")) return { reply: "Mock AI reply" };
  return { data: [] };
}
module.exports = { customer, flight, api, calls, token };
