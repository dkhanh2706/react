const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const http = require("node:http");
const { spawn } = require("node:child_process");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class LiveBrowser {
  constructor(backendUrl, dist) {
    this.backendUrl = backendUrl;
    this.dist = dist;
    this.pending = new Map();
    this.errors = [];
    this.responses = [];
    this.sequence = 0;
    this.tabs = [];
    this.waiters = [];
  }
  async start() {
    this.server = http.createServer((req, res) => {
      const target = path.resolve(this.dist, "." + new URL(req.url, "http://local").pathname);
      const file = target.startsWith(this.dist + path.sep) && fs.existsSync(target) && fs.statSync(target).isFile() ? target : path.join(this.dist, "index.html");
      res.setHeader("Content-Type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html");
      res.end(fs.readFileSync(file));
    }).listen(0, "127.0.0.1");
    await new Promise(resolve => this.server.once("listening", resolve));
    this.origin = `http://127.0.0.1:${this.server.address().port}`;
    const chrome = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean).find(p => fs.existsSync(p));
    if (!chrome) throw new Error("Chrome/Edge is required; set CHROME_PATH if necessary");
    this.profile = fs.mkdtempSync(path.join(os.tmpdir(), "booking-live-check-"));
    this.process = spawn(chrome, ["--headless", "--disable-gpu", "--disable-background-networking", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${this.profile}`, "about:blank"], { windowsHide: true });
    const endpoint = await new Promise((resolve, reject) => {
      let output = "";
      this.process.once("error", reject);
      this.process.stderr.on("data", data => { output += data; const m = output.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
      setTimeout(() => reject(new Error("Chrome startup timeout")), 15000).unref();
    });
    this.socket = new WebSocket(endpoint);
    await new Promise(resolve => this.socket.addEventListener("open", resolve, { once: true }));
    this.socket.addEventListener("message", event => this.message(JSON.parse(event.data)));
    return this;
  }
  command(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
      timer.unref();
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  async message(data) {
    if (data.id) {
      const item = this.pending.get(data.id); this.pending.delete(data.id);
      if (!item) return;
      clearTimeout(item.timer);
      if (data.error) item.reject(new Error(data.error.message)); else item.resolve(data.result);
      return;
    }
    for (const waiter of [...this.waiters]) {
      if (data.method === waiter.method && data.sessionId === waiter.sessionId) { waiter.cancel(); waiter.resolve(data.params); }
    }
    if (data.method === "Runtime.exceptionThrown") this.errors.push(data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text);
    if (data.method === "Page.javascriptDialogOpening") {
      await this.command("Page.handleJavaScriptDialog", { accept: true }, data.sessionId);
    }
    if (data.method === "Network.responseReceived") {
      const response = data.params.response;
      if (response.url.startsWith(this.backendUrl + "/api/")) this.responses.push({ path: new URL(response.url).pathname, status: response.status });
    }
    if (data.method !== "Fetch.requestPaused") return;
    const { requestId, request } = data.params;
    const sessionId = data.sessionId;
    const url = new URL(request.url);
    try {
      // The browser sends API requests directly to the isolated Express server,
      // including real preflight, multipart uploads and WebSocket handshakes.
      if (request.url.startsWith(this.backendUrl)) {
        await this.command("Fetch.continueRequest", { requestId }, sessionId);
      } else if (url.pathname.startsWith("/uploads/")) {
        const headers = { Origin: this.origin };
        for (const [name, value] of Object.entries(request.headers)) if (["authorization", "content-type"].includes(name.toLowerCase())) headers[name] = value;
        let body;
        if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
          if (request.postDataEntries?.length && request.postDataEntries.every(entry => entry.bytes)) body = Buffer.concat(request.postDataEntries.map(entry => Buffer.from(entry.bytes, "base64")));
          else body = request.postData;
        }
        const response = await fetch(this.backendUrl + url.pathname + url.search, { method: request.method, headers, body });
        const bytes = Buffer.from(await response.arrayBuffer());
        const responseHeaders = [{ name: "Access-Control-Allow-Origin", value: this.origin }, { name: "Access-Control-Allow-Headers", value: "Authorization, Content-Type" }, { name: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" }];
        for (const name of ["content-type", "x-content-type-options", "retry-after"]) if (response.headers.has(name)) responseHeaders.push({ name, value: response.headers.get(name) });
        await this.command("Fetch.fulfillRequest", { requestId, responseCode: response.status, responseHeaders, body: bytes.toString("base64") }, sessionId);
      } else if (url.pathname.startsWith("/api/")) {
        throw new Error("Unredirected API URL: " + url.pathname);
      } else if (request.url.startsWith(this.origin)) await this.command("Fetch.continueRequest", { requestId }, sessionId);
      else await this.command("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" }, sessionId);
    } catch (error) {
      this.errors.push(`HTTP bridge ${url.pathname}: ${error.message}`);
      this.command("Fetch.failRequest", { requestId, errorReason: "Failed" }, sessionId).catch(() => {});
    }
  }
  event(method, sessionId) {
    const waiter = { method, sessionId };
    waiter.cancel = () => { clearTimeout(waiter.timer); this.waiters = this.waiters.filter(item => item !== waiter); };
    waiter.promise = new Promise((resolve, reject) => {
      waiter.resolve = resolve;
      waiter.timer = setTimeout(() => { waiter.cancel(); reject(new Error(`Browser event timeout: ${method}`)); }, 20000);
      waiter.timer.unref();
    });
    this.waiters.push(waiter);
    return waiter;
  }
  async tab() {
    const { browserContextId } = await this.command("Target.createBrowserContext");
    const { targetId } = await this.command("Target.createTarget", { url: "about:blank", browserContextId });
    const { sessionId } = await this.command("Target.attachToTarget", { targetId, flatten: true });
    const tab = new Tab(this, sessionId, targetId);
    this.tabs.push(tab);
    await tab.command("Runtime.enable"); await tab.command("Page.enable"); await tab.command("Network.enable");
    await tab.command("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
    const wsUrl = this.backendUrl.replace(/^http/, "ws") + "/api/chat/live";
    await tab.command("Page.addScriptToEvaluateOnNewDocument", { source: `
      const testBackend = ${JSON.stringify(this.backendUrl)};
      const redirectApi = value => { const url = new URL(value, location.origin); return url.pathname.startsWith('/api/') ? testBackend + url.pathname + url.search : value; };
      const nativeOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(...args) { args[1] = redirectApi(args[1]); return nativeOpen.apply(this, args); };
      const nativeFetch = window.fetch.bind(window);
      window.fetch = (input, init) => nativeFetch(input instanceof Request ? new Request(redirectApi(input.url), input) : redirectApi(String(input)), init);
      const NativeWebSocket = window.WebSocket;
      window.WebSocket = class extends NativeWebSocket { constructor(url, protocols) { super(${JSON.stringify(wsUrl)}, protocols); } };
    ` });
    return tab;
  }
  async close() {
    this.socket?.close(); this.process?.kill();
    if (this.server) await new Promise(resolve => this.server.close(resolve));
  }
}

class Tab {
  constructor(browser, sessionId, targetId) { Object.assign(this, { browser, sessionId, targetId }); }
  async command(method, params = {}) {
    if (!["Page.navigate", "Page.reload"].includes(method)) return this.browser.command(method, params, this.sessionId);
    const loaded = this.browser.event("Page.loadEventFired", this.sessionId);
    try {
      const result = await this.browser.command(method, params, this.sessionId);
      await loaded.promise;
      return result;
    } catch (error) { loaded.cancel(); throw error; }
  }
  async evaluate(expression) {
    const result = await this.command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async wait(expression, label) {
    for (let i = 0; i < 120; i++) { if (await this.evaluate(expression)) return; await sleep(100); }
    throw new Error(`Timeout ${label}: ${await this.evaluate("document.body.innerText.slice(-1800)")}`);
  }
  async visit(route, condition) {
    await this.command("Page.navigate", { url: this.browser.origin + route });
    await this.wait(`location.pathname === ${JSON.stringify(route.split("?")[0])}`, `navigate ${route}`);
    if (condition) await this.wait(condition, route);
  }
  async click(selector) {
    await this.wait(`!!document.querySelector(${JSON.stringify(selector)})&&!document.querySelector(${JSON.stringify(selector)}).disabled`, `click ${selector}`);
    return this.evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  }
  async clickText(text, scope = "button") {
    const find = `[...document.querySelectorAll(${JSON.stringify(scope)})].find(e=>!e.disabled&&e.textContent.includes(${JSON.stringify(text)}))`;
    await this.wait(`!!(${find})`, `click text ${text}`);
    return this.evaluate(`${find}.click()`);
  }
  async fill(selector, value) {
    await this.wait(`!!document.querySelector(${JSON.stringify(selector)})&&!document.querySelector(${JSON.stringify(selector)}).disabled`, `fill ${selector}`);
    return this.evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e)throw new Error('Missing field: '+${JSON.stringify(selector)}); const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true})); })()`);
  }
  async screenshot(file) { const result = await this.command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); fs.writeFileSync(file, Buffer.from(result.data, "base64")); }
}

module.exports = { LiveBrowser, sleep };
