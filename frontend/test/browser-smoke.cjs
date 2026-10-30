// Browser smoke checks use only in-memory API fixtures, never real accounts or payments.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const os = require("node:os");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const fixture = require("./fixtures/browser-api.cjs");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const errors = [];
let chrome, socket, server, sessionId, sequence = 0;
const pending = new Map();
let assertions = 0;

function command(method, params = {}, target = sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params, ...(target ? { sessionId: target } : {}) }));
  });
}
async function evaluate(expression) {
  const data = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (data.exceptionDetails) throw new Error(data.exceptionDetails.exception?.description || data.exceptionDetails.text);
  return data.result.value;
}
async function waitFor(expression, label) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate(expression)) { assertions++; return; }
    await sleep(100);
  }
  throw new Error(`Timeout: ${label}\n${await evaluate("document.body.innerText.slice(-1600)")}`);
}
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const clickText = text => evaluate(`[...document.querySelectorAll('button')].find(button => !button.disabled && button.textContent.includes(${JSON.stringify(text)})).click()`);
async function fill(selector, value) {
  await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); const prototype = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : element.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); })()`);
}

async function main() {
  const dist = path.resolve(__dirname, "../dist");
  assert.ok(fs.existsSync(path.join(dist, "index.html")), "Run npm run build first");
  const executable = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find(file => fs.existsSync(file));
  assert.ok(executable, "Install Chrome/Edge or set CHROME_PATH");
  const browserProfile = fs.mkdtempSync(path.join(os.tmpdir(), "booking-ui-check-"));
  server = http.createServer((request, response) => {
    const target = path.resolve(dist, "." + new URL(request.url, "http://local").pathname);
    const file = target.startsWith(dist + path.sep) && fs.existsSync(target) && fs.statSync(target).isFile() ? target : path.join(dist, "index.html");
    response.setHeader("Content-Type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html");
    response.end(fs.readFileSync(file));
  }).listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  chrome = spawn(executable, ["--headless", "--disable-gpu", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${browserProfile}`, "about:blank"], { windowsHide: true });
  let stderr = "";
  const endpoint = await new Promise((resolve, reject) => {
    chrome.once("error", reject);
    chrome.stderr.on("data", data => { stderr += data; const match = stderr.match(/DevTools listening on (ws:\/\/\S+)/); if (match) resolve(match[1]); });
    setTimeout(() => reject(new Error("Chrome startup timeout")), 15000).unref();
  });
  socket = new WebSocket(endpoint);
  await new Promise(resolve => socket.addEventListener("open", resolve, { once: true }));
  socket.addEventListener("message", async event => {
    const data = JSON.parse(event.data);
    if (data.id) {
      const callback = pending.get(data.id); pending.delete(data.id);
      if (data.error) callback?.reject(new Error(data.error.message)); else callback?.resolve(data.result);
      return;
    }
    if (data.method === "Runtime.exceptionThrown") errors.push(data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text);
    if (data.method === "Fetch.requestPaused") {
      const { requestId, request } = data.params;
      try {
        if (new URL(request.url).pathname.startsWith("/api/")) {
          await command("Fetch.fulfillRequest", { requestId, responseCode: request.method === "OPTIONS" ? 204 : 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }, { name: "Access-Control-Allow-Origin", value: origin }, { name: "Access-Control-Allow-Headers", value: "Authorization, Content-Type" }, { name: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" }], body: Buffer.from(request.method === "OPTIONS" ? "" : JSON.stringify(fixture.api(request.url, request.method, request.postData))).toString("base64") });
        } else if (request.url.startsWith(origin)) await command("Fetch.continueRequest", { requestId });
        else await command("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" });
      } catch (error) { errors.push(error.message); }
    }
  });
  const { targetId } = await command("Target.createTarget", { url: "about:blank" }, null);
  sessionId = (await command("Target.attachToTarget", { targetId, flatten: true }, null)).sessionId;
  await command("Runtime.enable"); await command("Page.enable");
  await command("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
  await command("Page.addScriptToEvaluateOnNewDocument", { source: `
    const guest = /\\/(login|register|forgot-password|reset-password)$/.test(location.pathname) || location.search.includes('guest=1');
    if (guest) { localStorage.removeItem('token'); localStorage.removeItem('user'); }
    else { localStorage.setItem('user', JSON.stringify({...${JSON.stringify(fixture.customer)},role:location.pathname.startsWith('/admin')?'ADMIN':'CUSTOMER'}));localStorage.setItem('token',${JSON.stringify(fixture.token())}); }
    if(location.pathname==='/passenger-info')history.replaceState({usr:{flight:${JSON.stringify(fixture.flight)}},key:'test',idx:0},'',location.href);
    window.alert=()=>{};window.confirm=()=>true;
    window.WebSocket=class{static OPEN=1;static CONNECTING=0;readyState=1;constructor(){setTimeout(()=>{this.onopen?.();this.onmessage?.({data:'{"type":"ready"}'})},10)}send(){}close(){this.readyState=3;}};
  ` });
  async function visit(route, condition, label) {
    await command("Page.navigate", { url: origin + route });
    await waitFor(condition, label);
    assert.ok(!(await evaluate("document.body.innerText")).match(/Invalid Date|NaN/), `Invalid formatting on ${route}`);
  }

  await visit("/register", "!!document.querySelector('input[name=full_name]')", "register");
  for (const [name, value] of Object.entries({ full_name: "Nguyen Van Test", email: "new@example.test", password: "Password123!", phone: "0900000000" })) await fill(`input[name=${name}]`, value);
  await clickText("Đăng ký tài khoản"); await waitFor("location.pathname==='/login'", "register redirect");
  await fill('input[type=email]', fixture.customer.email); await fill('input[type=password]', 'Password123!'); await evaluate("document.querySelector('form').requestSubmit()");
  await waitFor("location.pathname==='/home' && !!localStorage.getItem('token')", "login");
  await visit("/forgot-password", "!!document.querySelector('input[type=email]')", "forgot password"); await fill('input[type=email]', fixture.customer.email); await evaluate("document.querySelector('form').requestSubmit()"); await waitFor("location.pathname==='/reset-password'", "reset redirect");
  await fill('input[name=email]', fixture.customer.email); await fill('input[name=code]', '123456'); await fill('input[name=newPassword]', 'NewPassword123!'); await evaluate("document.querySelector('form').requestSubmit()"); await waitFor("location.pathname==='/login'", "reset complete");
  console.log("PASS registration, login and password recovery forms");

  await visit("/profile", "!!document.querySelector('.account-profile-card')&&!document.querySelector('.profile-loading')", "profile");
  await click('.account-edit-button'); await fill('input[name=full_name]', 'Nguyen Van Updated'); await click('.profile-save-button'); await waitFor("document.body.innerText.includes('Nguyen Van Updated')&&!document.querySelector('.profile-save-button')", "save profile");
  await click('.change-password-button'); await click('.password-send-code-button'); await waitFor("!!document.querySelector('input[name=code]')", "request password code");
  await fill('input[name=code]', '123456'); await fill('input[name=newPassword]', 'NewPassword123!'); await fill('input[name=confirmPassword]', 'NewPassword123!');
  await click('.password-confirm-button'); await waitFor("location.pathname==='/login'&&!localStorage.getItem('token')", "password change logout");
  console.log("PASS profile edit, OTP password change and session invalidation");

  await visit("/flights?from=HAN&to=SGN&date=2080-01-01", "document.body.innerText.includes('VN-TEST')", "flight search");
  await visit("/passenger-info", "!!document.querySelector('input[name=document_number]')", "passenger");
  await fill('input[name=date_of_birth]', '2000-01-01'); await fill('input[name=document_number]', '123456789012'); await click('.baggage-options button:nth-child(2)'); await click('.insurance-option'); await fill('.meal-select', 'CHICKEN_RICE');
  await clickText('Tiếp tục'); await waitFor("!!document.querySelector('.seat.economy')", "seat map");
  await click('[title$="- FIRST"]'); await waitFor("!!document.querySelector('.seat.selected[title$=\"- FIRST\"]')&&!document.querySelector('.seat.economy').disabled", "FIRST seat hold");
  assert.ok((await evaluate("document.querySelector('.seat-selection-summary').innerText")).includes('Phụ thu hạng Nhất'));
  assert.equal(await evaluate("document.querySelector('.final-price').innerText"), '3.280.000đ');
  await click('[title$="- BUSINESS"]'); await waitFor("!!document.querySelector('.seat.selected[title$=\"- BUSINESS\"]')&&!document.querySelector('.seat.economy').disabled", "BUSINESS seat hold");
  assert.ok((await evaluate("document.querySelector('.seat-selection-summary').innerText")).includes('Phụ thu hạng Thương gia'));
  assert.equal(await evaluate("document.querySelector('.final-price').innerText"), '2.530.000đ');
  await click('.seat.economy'); await waitFor("!!document.querySelector('.seat.selected')&&!document.querySelector('.seat.business').disabled", "ECONOMY seat hold");
  assert.equal(await evaluate("document.querySelector('.final-price').innerText"), '1.780.000đ');
  await click('.btn-proceed-pay'); await waitFor("!!document.querySelector('.order-summary-card')", "checkout");
  console.log('PASS ECONOMY/BUSINESS/FIRST displayed fares and surcharge labels');
  assert.ok((await evaluate("document.querySelector('.order-summary-card').innerText")).includes('1.780.000'));
  await visit("/my-orders", "!!document.querySelector('.orders-card-pending')", "pending orders");
  await evaluate("document.querySelector('a[href*=bookingId]').click()"); await waitFor("!!document.querySelector('.order-summary-card')", "resume checkout");
  await clickText('Thanh toán giả lập'); await waitFor("document.body.innerText.includes('Thanh toán giả lập thành công')", "payment result");
  console.log("PASS search, passenger/services, seat hold, resume checkout and demo payment");

  await visit("/my-tickets", "!!document.querySelector('.ticket-review-heading button:not(:disabled)')", "tickets");
  await clickText('Viết đánh giá'); await click('input[type=radio][value="5"]'); await fill('.ticket-review-form textarea', 'Dat ve thuan tien, thong tin ro rang.'); await click('.ticket-review-form button[type=submit]'); await waitFor("!!document.querySelector('.ticket-review-comment')", "submit review");
  await clickText('Xóa đánh giá'); await clickText('Xóa vĩnh viễn'); await waitFor("document.body.innerText.includes('không thể gửi lại')", "delete review");
  console.log("PASS tickets, rating submission and review deletion");

  await visit("/blog", "!!document.querySelector('.article-card')", "blog"); await click('.article-card'); await waitFor("location.pathname.startsWith('/blog/')", "blog detail");
  await visit("/destinations", "!!document.querySelector('.destinations-page')||!!document.querySelector('main')", "destinations");
  await visit("/home", "!!document.querySelector('.support-button')", "home"); await click('.support-button'); await waitFor("!!document.querySelector('.quick-options')&&!document.querySelector('.chatbot-input-area input').disabled", "chat ready");
  await evaluate("[...document.querySelectorAll('.quick-options button')].find(button=>button.textContent.includes('Tìm chuyến bay')).click()"); await waitFor("document.body.innerText.includes('Bạn muốn bay từ đâu')", "guided chatbot");
  console.log("PASS blog, destinations and guided chatbot");

  await visit("/admin", "document.body.innerText.includes('Tổng chuyến bay')", "dashboard");
  await visit("/admin/users", "document.body.innerText.includes('Customer Two')", "users");
  await evaluate("[...document.querySelectorAll('tr')].find(row=>row.textContent.includes('Customer Two')).querySelector('button').click()");
  await clickText('Xác nhận khóa tài khoản');
  await waitFor("document.body.innerText.includes('Đã khóa')||document.body.innerText.includes('Mở khóa')", "lock user");
  await visit("/admin/flights", "!!document.querySelector('[title=\"Chỉnh sửa chuyến bay\"]')", "admin flights"); await click('[title="Chỉnh sửa chuyến bay"]');
  assert.equal(await evaluate("document.querySelector('.adm-modal-body input[name=flight_number]').disabled"), true); await click('.btn-close-modal'); await click('[title="Hủy chuyến bay"]'); await fill('#flight-cancel-reason', 'Huy chuyen trong kiem thu'); await click('.btn-danger-confirm'); await waitFor("!document.querySelector('.confirm-modal')", "cancel flight");
  console.log("PASS dashboard, user lock and flight edit/cancel");

  await visit("/admin/bookings", "!!document.querySelector('.bk-order-code')", "admin orders"); await clickText('Hủy đơn'); await waitFor("!!document.querySelector('.bk-dialog textarea')", "cancel order dialog"); await fill('.bk-dialog textarea', 'Huy don trong kiem thu'); await clickText('Xác nhận hủy đơn'); await waitFor("!document.querySelector('.bk-dialog')", "cancel order");
  await click('.bk-view'); await waitFor("!!document.querySelector('.refund-review form')", "refund form");
  await fill('.refund-review input:not([type=checkbox])', 'REFUND-TEST'); await fill('.refund-review textarea', 'Da xu ly hoan tien gia lap'); await click('.refund-review input[type=checkbox]'); await click('.refund-review button[type=submit]');
  await waitFor("!document.querySelector('.bk-dialog')&&document.body.innerText.includes('Đã hủy')", "refund saved");
  await click('.bk-view'); await waitFor("document.body.innerText.includes('REFUND-TEST')", "persisted refund reference");
  await visit("/admin/payments", "document.body.innerText.includes('BKTEST')", "admin payments");
  await visit("/admin/chat", "!!document.querySelector('.admin-chat-item')", "admin chat"); await click('.admin-chat-item'); await waitFor("document.body.innerText.includes('Tiếp nhận')", "chat detail"); await clickText('Tiếp nhận'); await waitFor("!document.querySelector('.admin-chat-compose input').disabled", "accept chat"); await fill('.admin-chat-compose input', 'Xin chao, toi se ho tro ban.'); await evaluate("document.querySelector('.admin-chat-compose').requestSubmit()"); await waitFor("document.querySelector('.admin-chat-messages').innerText.includes('Xin chao, toi se ho tro ban.')", "send staff reply"); await clickText('Kết thúc hỗ trợ');
  console.log("PASS order cancellation, manual refund, payment history and staff chat");

  await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  for (const [route, ready] of [["/profile", ".account-profile-card"], ["/my-orders", ".orders-card"], ["/payment?bookingId=77", ".order-summary-card"]]) {
    await visit(route, `!!document.querySelector('${ready}')`, `mobile ${route}`);
    assert.ok(await evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"), `Horizontal overflow: ${route}`);
  }
  for (const [width, height] of [[1024, 500], [390, 640], [844, 390]]) {
    await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    await visit("/home", "!!document.querySelector('.support-button')", `chat viewport ${width}x${height}`);
    await click('.support-button'); await waitFor("!!document.querySelector('.chatbot-header')", "chat header");
    const bounds = await evaluate("(()=>{const box=document.querySelector('.chatbot-box').getBoundingClientRect();return {top:box.top,bottom:box.bottom,left:box.left,right:box.right,width:innerWidth,height:innerHeight};})()");
    assert.ok(bounds.top >= 0 && bounds.left >= 0 && bounds.bottom <= bounds.height + 1 && bounds.right <= bounds.width + 1, JSON.stringify(bounds));
  }
  console.log('PASS chatbot fits short desktop, portrait and landscape viewports');
  await visit("/my-orders?guest=1", "location.pathname==='/login'", "protected route");
  assert.deepEqual(errors, []);
  console.log(`PASS mobile layouts, protected routes and no uncaught JavaScript errors (${assertions} waits, ${fixture.calls.length} mock API calls)`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  socket?.close(); chrome?.kill();
  if (server) await new Promise(resolve => server.close(resolve));
});
