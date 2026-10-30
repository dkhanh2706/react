const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("../../backend/node_modules/sharp");

module.exports = async function browserLive({ browser, backendUrl, db, runDir, adminEmail, adminPassword }) {
  const tab = await browser.tab();
  const stages = [];
  const customerEmail = "full.customer@example.test", password = "CustomerTest123!";
  const date = "2035-06-15";
  async function api(route, { method = "GET", token, body } = {}) {
    const response = await fetch(backendUrl + "/api" + route, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: await response.json() };
  }
  async function login(target, email, pass) {
    await target.visit("/login", "!!document.querySelector('input[type=email]')");
    await target.fill('input[type=email]', email); await target.fill('input[type=password]', pass);
    await target.evaluate("document.querySelector('form').requestSubmit()");
    await target.wait("location.pathname!=='/login'&&!!localStorage.getItem('token')", "login");
    return target.evaluate("localStorage.getItem('token')");
  }
  function pass(name) { stages.push(name); console.log("PASS live " + name); }
  async function cleanView(target, label) {
    assert.ok(!(await target.evaluate("document.body.innerText")).match(/Invalid Date|NaN/), label);
  }

  await tab.visit("/register", "!!document.querySelector('input[name=full_name]')");
  for (const [name, value] of Object.entries({ full_name: "Nguyen Van Test", email: customerEmail, password, phone: "0900000000" })) await tab.fill(`input[name=${name}]`, value);
  await tab.clickText("Đăng ký tài khoản");
  await tab.wait("location.pathname==='/login'", "register redirect");
  const customerToken = await login(tab, customerEmail, password);
  const customer = (await db.query("SELECT id,role,password_hash FROM users WHERE email=$1", [customerEmail])).rows[0];
  assert.equal(customer.role, "CUSTOMER"); assert.ok(customer.password_hash.startsWith("$2"));
  const duplicate = await api("/auth/register", { method: "POST", body: { full_name: "Nguyen Van Test", email: customerEmail, password, phone: "0900000000" } });
  assert.equal(duplicate.status, 400);
  assert.equal((await api("/users", { token: customerToken })).status, 403);
  pass("registration, login, duplicate account and admin API authorization");

  await tab.visit("/profile", "!!document.querySelector('.account-profile-card')&&!document.querySelector('.profile-loading')");
  await tab.click(".account-edit-button"); await tab.wait("!!document.querySelector('input[name=full_name]')", "editable profile");
  await tab.fill('input[name=full_name]', "Nguyen Van Updated"); await tab.click(".profile-save-button");
  await tab.wait("!document.querySelector('.profile-save-button')&&document.body.innerText.includes('Nguyen Van Updated')", "saved profile");
  assert.equal((await db.query("SELECT full_name FROM users WHERE id=$1", [customer.id])).rows[0].full_name, "Nguyen Van Updated");
  const avatarFile = path.join(runDir, "avatar.png");
  await sharp({ create: { width: 64, height: 64, channels: 3, background: "blue" } }).png().toFile(avatarFile);
  const { root } = await tab.command("DOM.getDocument");
  const { nodeId } = await tab.command("DOM.querySelector", { nodeId: root.nodeId, selector: 'input[type=file]' });
  await tab.command("DOM.setFileInputFiles", { nodeId, files: [avatarFile] });
  await tab.wait("!!document.querySelector('.account-profile-top img[src$=\".webp\"]')", "avatar normalized");
  const avatar = (await db.query("SELECT avatar_url FROM users WHERE id=$1", [customer.id])).rows[0].avatar_url;
  assert.match(avatar, /\.webp$/);
  await tab.visit("/profile", "!!document.querySelector('.account-profile-top img[src$=\".webp\"]')");
  await tab.wait("document.querySelector('.account-profile-top img').naturalWidth > 0", "avatar image rendered");
  pass("profile editing and real multipart avatar upload/persistence");

  await tab.visit("/home", "document.querySelectorAll('select[name=from] option').length>2");
  await tab.fill('select[name=from]', "HAN"); await tab.fill('select[name=to]', "SGN"); await tab.fill('input[name=departDate]', date); await tab.click(".search-button");
  await tab.wait("location.pathname==='/flights'&&!!document.querySelector('.flight-select-button')", "search results");
  await tab.click(".flight-select-button");
  await tab.wait("location.pathname==='/passenger-info'&&!!document.querySelector('input[name=document_number]')", "passenger information");
  await tab.fill('input[name=date_of_birth]', "2000-01-01"); await tab.fill('input[name=document_number]', "123456789012");
  await tab.click(".baggage-options button:nth-child(2)"); await tab.fill(".meal-select", "CHICKEN_RICE"); await tab.click(".insurance-option");
  await tab.clickText("Tiếp tục"); await tab.wait("!!document.querySelector('.seat.economy')", "seat map");
  await tab.click(".seat.economy"); await tab.wait("!!document.querySelector('.seat.selected')", "seat held");
  await tab.click(".btn-proceed-pay"); await tab.wait("!!document.querySelector('.order-summary-card')", "checkout");
  const bookingId = Number(await tab.evaluate("new URLSearchParams(location.search).get('bookingId')"));
  let stored = (await db.query("SELECT b.*,d.flight_id,d.seat_id,d.hold_expires_at,d.seat_status FROM bookings b JOIN booking_details d ON d.booking_id=b.id WHERE b.id=$1", [bookingId])).rows[0];
  const holdDeadline = +new Date(stored.hold_expires_at);
  assert.equal(Number(stored.total_price), 1780000); assert.equal(stored.status, "PENDING"); assert.equal(stored.seat_status, "HOLD");
  await tab.command("Page.reload"); await tab.wait("!!document.querySelector('.order-summary-card')", "checkout reload");
  await tab.visit("/my-orders", "!!document.querySelector('.orders-card-pending')");
  await tab.evaluate("document.querySelector('a[href*=bookingId]').click()"); await tab.wait("!!document.querySelector('.order-summary-card')", "resume checkout");
  assert.equal(+new Date((await db.query("SELECT hold_expires_at FROM booking_details WHERE booking_id=$1", [bookingId])).rows[0].hold_expires_at), holdDeadline);
  const otherEmail = "full.other@example.test";
  assert.equal((await api("/auth/register", { method: "POST", body: { full_name: "Other Customer", email: otherEmail, password, phone: "0900000001" } })).status, 201);
  const otherToken = (await api("/auth/login", { method: "POST", body: { email: otherEmail, password } })).data.token;
  assert.equal((await api(`/bookings/${bookingId}/checkout`, { token: otherToken })).status, 404);
  pass("real search/demo flight, passenger/services, seat hold, reload/resume and order isolation");

  await tab.command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  for (const [route, selector] of [["/profile", ".account-profile-card"], ["/my-orders", ".orders-card"], [`/payment?bookingId=${bookingId}`, ".order-summary-card"]]) {
    await tab.visit(route, `!!document.querySelector('${selector}')`);
    assert.ok(await tab.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"), "Mobile overflow: " + route);
    await cleanView(tab, route);
  }
  await tab.screenshot(path.join(runDir, "mobile-checkout.png"));
  await tab.command("Emulation.clearDeviceMetricsOverride");
  // External providers are deliberately unconfigured on this isolated server.
  await tab.click(".momo-button");
  await tab.wait("(document.body.innerText.includes('Không thể tạo thanh toán MoMo')||document.body.innerText.includes('Server error'))&&!document.querySelector('.momo-button').disabled", "unconfigured provider error displayed");
  assert.ok(browser.responses.some(response => response.path.endsWith('/payments/momo/create') && response.status === 502));
  assert.equal((await db.query("SELECT status FROM payments WHERE booking_id=$1 ORDER BY id DESC LIMIT 1", [bookingId])).rows[0].status, "FAILED");
  await tab.clickText("Thanh toán giả lập"); await tab.wait("document.body.innerText.includes('Thanh toán giả lập thành công')", "demo payment");
  stored = (await db.query("SELECT b.status,d.seat_status FROM bookings b JOIN booking_details d ON d.booking_id=b.id WHERE b.id=$1", [bookingId])).rows[0];
  assert.deepEqual(stored, { status: "CONFIRMED", seat_status: "BOOKED" });
  assert.equal((await db.query("SELECT count(*)::int AS n FROM payments WHERE booking_id=$1 AND status='SUCCESS'", [bookingId])).rows[0].n, 1);
  pass("mobile layouts, failed-provider handling and real demo payment persisted in PostgreSQL");

  await tab.visit("/my-tickets", "!!document.querySelector('.ticket-review-heading button:not(:disabled)')");
  await tab.clickText("Viết đánh giá"); await tab.click('input[type=radio][value="5"]'); await tab.fill(".ticket-review-form textarea", "Full test real backend review"); await tab.click('.ticket-review-form button[type=submit]');
  await tab.wait("!!document.querySelector('.ticket-review-comment')", "review submitted");
  assert.equal((await db.query("SELECT rating FROM customer_reviews WHERE booking_id=$1", [bookingId])).rows[0].rating, 5);
  await tab.visit("/home", "document.body.innerText.includes('Full test real backend review')");
  await tab.visit("/my-tickets", "!!document.querySelector('.ticket-review-comment')"); await tab.clickText("Xóa đánh giá"); await tab.clickText("Xóa vĩnh viễn"); await tab.wait("document.body.innerText.includes('không thể gửi lại')", "review deleted");
  assert.equal((await db.query("SELECT count(*)::int AS n FROM customer_reviews WHERE booking_id=$1", [bookingId])).rows[0].n, 0);
  assert.equal((await api(`/reviews/${bookingId}`, { method: "POST", token: customerToken, body: { rating: 5, comment: "Cannot resubmit" } })).status, 409);
  await tab.visit("/blog", "!!document.querySelector('.article-card')"); await tab.click(".article-card"); await tab.wait("location.pathname.startsWith('/blog/')", "blog details");
  pass("tickets, stored/public reviews, permanent deletion and blog navigation");

  // A separate browser context logs in as admin; the customer's real session remains separate.
  const admin = await browser.tab(); const adminToken = await login(admin, adminEmail, adminPassword);
  await admin.visit("/admin/users", `document.body.innerText.includes(${JSON.stringify(customerEmail)})`);
  const customerRow = `[...document.querySelectorAll('tr')].find(row=>row.textContent.includes(${JSON.stringify(customerEmail)}))`;
  await admin.evaluate(`${customerRow}.querySelector('button[title="Khóa tài khoản này"]').click()`); await admin.clickText("Xác nhận khóa tài khoản");
  await admin.wait("!!document.querySelector('[title=\"Mở khóa tài khoản này\"]')", "account locked");
  assert.equal((await api("/users/profile", { token: customerToken })).status, 401);
  await admin.evaluate(`${customerRow}.querySelector('button[title="Mở khóa tài khoản này"]').click()`); await admin.clickText("Xác nhận mở khóa"); await admin.wait("!document.querySelector('.confirm-modal')", "account unlocked");
  assert.equal((await api("/users/profile", { token: customerToken })).status, 401);
  const freshCustomerToken = (await api("/auth/login", { method: "POST", body: { email: customerEmail, password } })).data.token;
  assert.equal((await api("/users/profile", { token: freshCustomerToken })).status, 200);
  pass("admin lock/unlock, immediate token revocation and fresh customer login");

  await admin.visit("/admin/flights", "!!document.querySelector('.adm-flights-page')&&!document.querySelector('.adm-table-loading')");
  await admin.clickText("Thêm chuyến bay"); await admin.wait("!!document.querySelector('.adm-modal-body')", "create flight form");
  const catalog = (await api("/flights/catalog")).data;
  const han = catalog.airports.find(a => a.code === "HAN").id, sgn = catalog.airports.find(a => a.code === "SGN").id;
  await admin.wait("document.querySelectorAll('.adm-modal-body select[name=airline_id] option').length>0", "airline catalog ready");
  await admin.fill('.adm-modal-body select[name=airline_id]', String(catalog.airlines[0].id));
  await admin.wait("document.querySelectorAll('.adm-modal-body select[name=airplane_id] option').length>1", "airplane catalog ready");
  for (const [name, value] of Object.entries({ flight_number: "FULL-TEST", airplane_id: String(catalog.airplanes[0].id), departure_airport_id: String(han), arrival_airport_id: String(sgn), departure_time: "2036-07-01T10:00", arrival_time: "2036-07-01T12:00", price: "1600000" })) await admin.fill(`.adm-modal-body [name=${name}]`, value);
  const flightForm = await admin.evaluate("[...document.querySelectorAll('.adm-modal-body input,.adm-modal-body select')].map(e=>({name:e.name,value:e.value,valid:e.checkValidity(),message:e.validationMessage}))");
  assert.ok(flightForm.every(field=>field.valid), JSON.stringify(flightForm));
  await admin.evaluate("document.querySelector('form.adm-modal-body').requestSubmit()"); await admin.wait("!document.querySelector('.adm-modal-body')&&document.body.innerText.includes('FULL-TEST')", "flight created");
  await admin.fill(".adm-flights-page .adm-search-input-box input", "FULL-TEST");
  await admin.click('[title="Chỉnh sửa chuyến bay"]'); await admin.fill('.adm-modal-body input[name=price]', "1700000"); await admin.evaluate("document.querySelector('form.adm-modal-body').requestSubmit()"); await admin.wait("!document.querySelector('.adm-modal-body')", "flight updated");
  assert.equal(Number((await db.query("SELECT price FROM flights WHERE flight_number='FULL-TEST'")).rows[0].price), 1700000);
  await admin.click('[title="Xóa chuyến chưa sử dụng"]'); await admin.click(".btn-danger-confirm"); await admin.wait("!document.querySelector('.confirm-modal')", "unused flight deleted");
  assert.equal((await db.query("SELECT count(*)::int AS n FROM flights WHERE flight_number='FULL-TEST'")).rows[0].n, 0);
  pass("admin flight create, edit and delete through real APIs/database");

  await admin.visit("/admin/bookings", "!!document.querySelector('.bk-order-code')"); await admin.clickText("Hủy đơn"); await admin.wait("!!document.querySelector('.bk-dialog textarea')", "cancel order form"); await admin.fill(".bk-dialog textarea", "Full test cancellation"); await admin.clickText("Xác nhận hủy đơn"); await admin.wait("!document.querySelector('.bk-dialog')&&document.body.innerText.includes('Cần đối soát')", "cancel paid order");
  assert.equal((await db.query("SELECT status FROM bookings WHERE id=$1", [bookingId])).rows[0].status, "PAYMENT_REVIEW");
  assert.equal((await db.query("SELECT seat_status FROM booking_details WHERE booking_id=$1", [bookingId])).rows[0].seat_status, "CANCELLED");
  await admin.click(".bk-view"); await admin.wait("!!document.querySelector('.refund-review form')", "refund case");
  await admin.fill('.refund-review input:not([type=checkbox])', "FULL-REFUND"); await admin.fill(".refund-review textarea", "Full test mock refund recorded"); await admin.click('.refund-review input[type=checkbox]'); await admin.click('.refund-review button[type=submit]'); await admin.wait("!document.querySelector('.bk-dialog')&&document.body.innerText.includes('Đã hủy')", "refund saved");
  await admin.click(".bk-view"); await admin.wait("document.body.innerText.includes('FULL-REFUND')", "persisted refund reference");
  assert.equal((await db.query("SELECT status FROM payments WHERE booking_id=$1 AND method='MOCK'", [bookingId])).rows[0].status, "REFUNDED");
  assert.equal((await db.query("SELECT refund_reference FROM payment_review_cases WHERE booking_id=$1", [bookingId])).rows[0].refund_reference, "FULL-REFUND");
  assert.equal((await api(`/bookings/${bookingId}`, { method: "DELETE", token: adminToken, body: { booking_code: "WRONG-CONFIRMATION" } })).status, 400);
  await admin.visit("/admin/payments", "document.body.innerText.includes('Đã hoàn tiền')"); await cleanView(admin, "payments");
  pass("paid-order cancellation, seat release, refund persistence and payment history");

  await admin.visit("/admin/chat", "!!document.querySelector('.admin-chat-presence button:not(:disabled)')");
  if (!(await admin.evaluate("document.querySelector('.admin-chat-presence button').getAttribute('aria-pressed')==='true'"))) await admin.click(".admin-chat-presence button");
  await admin.wait("document.querySelector('.admin-chat-presence button').getAttribute('aria-pressed')==='true'", "staff online");
  const guest = await browser.tab(); await guest.visit("/home", "!!document.querySelector('.support-button')"); await guest.click(".support-button");
  await guest.wait("!!document.querySelector('.chat-staff-status button:not(:disabled)')", "staff available to guest");
  await guest.fill(".chatbot-input-area input", "Can ho tro dat ve"); await guest.click(".send-button"); await guest.wait("!document.querySelector('.chatbot-input-area input').disabled", "visitor message saved");
  await guest.clickText("Chat với nhân viên");
  await admin.wait("!!document.querySelector('.admin-chat-item')", "WebSocket queue update"); await admin.click(".admin-chat-item"); await admin.wait("!!document.querySelector('.admin-chat-toolbar button:not(:disabled)')", "accept conversation"); await admin.clickText("Tiếp nhận"); await admin.wait("!document.querySelector('.admin-chat-compose input').disabled", "staff owns conversation");
  await admin.fill(".admin-chat-compose input", "Full test staff reply"); await admin.evaluate("document.querySelector('.admin-chat-compose').requestSubmit()");
  await guest.wait("document.querySelector('.chatbot-body').innerText.includes('Full test staff reply')", "real-time staff reply");
  await admin.clickText("Kết thúc hỗ trợ"); await guest.wait("document.querySelector('.chatbot-body').innerText.includes('kết thúc hỗ trợ')", "support ended");
  assert.ok((await db.query("SELECT count(*)::int AS n FROM chat_messages WHERE text='Full test staff reply' AND sender='admin'")).rows[0].n > 0);
  await guest.screenshot(path.join(runDir, "live-chat.png"));
  pass("real browser WebSocket queue, staff claim/message/end and PostgreSQL chat history");

  for (const [width, height] of [[1024, 500], [390, 640], [844, 390]]) {
    await guest.command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    const bounds = await guest.evaluate("(()=>{const b=document.querySelector('.chatbot-box').getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:innerWidth,height:innerHeight};})()");
    assert.ok(bounds.top >= 0 && bounds.left >= 0 && bounds.bottom <= bounds.height + 1 && bounds.right <= bounds.width + 1, JSON.stringify(bounds));
  }
  await guest.screenshot(path.join(runDir, "landscape-chat.png"));
  pass("chat viewport containment on short desktop, portrait and landscape screens");

  assert.equal((await api("/chat", { method: "POST", body: { message: "Hello" } })).status, 503);
  assert.equal((await api("/auth/forgot-password", { method: "POST", body: { email: customerEmail } })).status, 503);
  assert.equal((await api("/flights/search?from=HAN&to=HAN&date=2035-06-15")).status, 400);
  assert.equal((await api("/bookings/mine")).status, 401);
  assert.equal((await api(`/bookings/${bookingId}`, { method: "DELETE", token: adminToken, body: { booking_code: (await db.query("SELECT booking_code FROM bookings WHERE id=$1", [bookingId])).rows[0].booking_code } })).status, 409);
  assert.deepEqual(browser.errors, []);
  pass("provider-disabled messages, invalid search, unauthorized access and history preservation");
  const result = { exitCode: 0, stages, realHttpResponses: browser.responses.length, browserErrors: browser.errors, database: { users: (await db.query("SELECT count(*)::int AS n FROM users")).rows[0].n, bookings: (await db.query("SELECT count(*)::int AS n FROM bookings")).rows[0].n, payments: (await db.query("SELECT count(*)::int AS n FROM payments")).rows[0].n } };
  fs.writeFileSync(path.join(runDir, "browser-live.json"), JSON.stringify(result, null, 2));
  return result;
};
