const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

module.exports = async function responsiveAudit({ visit, evaluate, command, click, fill, fixture, errors }) {
  const runDir = path.resolve(__dirname, '../../backend/temp', `responsive-audit-${new Date().toISOString().replace(/\D/g, '')}`);
  fs.mkdirSync(runDir, { recursive: true });
  const results = [];
  const flight = fixture.flight;
  await command('Page.addScriptToEvaluateOnNewDocument', { source: `
    if (location.pathname === '/booking') history.replaceState({usr:{flight:${JSON.stringify(flight)},passenger:{full_name:'Nguyen Test',gender:'MALE',date_of_birth:'2000-01-01',document_type:'CCCD',document_number:'123456789012',phone:'0900000000',email:'test@example.test'},services:{baggage_weight:10,baggage_price:150000,meal_type:'NONE',meal_price:0,insurance:false,insurance_price:0}},key:'audit',idx:0},'',location.href);
  ` });
  const routes = [
    ['/home?guest=1', '.hero'], ['/home', '.hero'],
    ['/destinations', '.destination-card'], ['/blog', '.article-card'],
    ['/blog/kinh-nghiem-san-ve-may-bay-gia-re', '.blog-detail-page'],
    ['/login', 'input[type=email]'], ['/register', '#register-confirm_password'],
    ['/forgot-password', 'input[type=email]'], ['/reset-password', 'input[name=newPassword]'],
    ['/flights?from=HAN&to=SGN&date=2080-01-01', '.flight-select-button'],
    ['/flight-list?from=HAN&to=SGN&date=2080-01-01', 'main'],
    ['/passenger-info', 'input[name=document_number]'], ['/booking', '.seat.economy'],
    ['/payment?bookingId=77', '.order-summary-card'], ['/payment-result?bookingId=77', '.payment-result-main'],
    ['/my-orders', '.orders-card'], ['/my-tickets', '.ticket-card-modern'], ['/profile', '.account-profile-card'],
    ['/admin', '.dash-donut'], ['/admin/users', 'tbody tr'], ['/admin/flights', 'tbody tr'],
    ['/admin/bookings', '.bk-order-code'], ['/admin/payments', 'tbody tr'], ['/admin/chat', '.admin-chat-item'],
  ];
  const sizes = process.argv.includes('--responsive-probes-only') ? [] : [[320, 740], [360, 800], [390, 844], [430, 932], [768, 1024], [844, 390], [1440, 900]];
  for (const [width, height] of sizes) {
    await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    for (const [route, ready] of routes) {
      try {
        await visit(route, `!!document.querySelector(${JSON.stringify(ready)})`, `${width} ${route}`);
        const details = await evaluate(`(() => {
          const visible = e => { const b=e.getBoundingClientRect();const s=getComputedStyle(e);return b.width>0&&b.height>0&&s.visibility!=='hidden'&&s.display!=='none'; };
          const fields=[...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea')].filter(visible);
          return {viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,
            smallTextFields:fields.filter(e=>parseFloat(getComputedStyle(e).fontSize)<16).map(e=>({name:e.name||e.id||e.placeholder||e.tagName,fontSize:getComputedStyle(e).fontSize})),
            unlabelledFields:fields.filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).map(e=>e.name||e.id||e.placeholder||e.tagName),
            textErrors:/Invalid Date|NaN/.test(document.body.innerText),
            externalImages:[...document.images].filter(e=>e.src.startsWith('https:')).length,
            overflowingElements:[...document.querySelectorAll('main *, .header *, .adm-content-viewport *')].filter(visible).filter(e=>{const b=e.getBoundingClientRect();return b.right>innerWidth+1||b.left< -1}).slice(0,12).map(e=>({tag:e.tagName,class:e.className.toString().slice(0,100)}))};
        })()`);
        const result = { width, height, route, ...details };
        if (width <= 640 && ['/admin/users', '/admin/flights', '/admin/payments', '/admin/bookings'].includes(route)) {
          assert.ok(await evaluate("getComputedStyle(document.querySelector('.admin-responsive-table tbody > tr')).display==='grid'"), `${route}: mobile card layout`);
          assert.ok(await evaluate("[...document.querySelectorAll('.admin-responsive-table tbody > tr:first-child > td')].every(cell=>!!cell.dataset.label)"), `${route}: all fields have labels`);
        }
        results.push(result);
        if (details.pageWidth > details.viewport + 1) console.log(`OVERFLOW ${width} ${route}: ${details.pageWidth}px`);
        if (width === 390 && ['/home?guest=1','/booking','/admin/users','/admin/bookings','/admin/chat'].includes(route)) {
          if (route === '/home?guest=1') await new Promise(resolve => setTimeout(resolve, 1300));
          const shot = await command('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(runDir, `${route.replace(/[^a-z0-9]/gi, '_')}-${width}.png`), Buffer.from(shot.data, 'base64'));
        }
      } catch (error) {
        results.push({ width, height, route, error: error.message });
        console.log(`FAIL ${width} ${route}: ${error.message.slice(0, 130)}`);
      }
    }
    console.log(`AUDITED ${width}x${height}`);
  }
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await visit('/home?guest=1', "!!document.querySelector('.mobile-menu-toggle')", 'guest mobile navigation');
  const heroHelp = await evaluate("(()=>{const p=document.querySelector('.flight-box > p');return {text:p.textContent,color:getComputedStyle(p).color,background:getComputedStyle(p.parentElement).backgroundColor}})()");
  await click('.mobile-menu-toggle');
  const guestLogin = await evaluate("({headerLoginDisplay:getComputedStyle(document.querySelector('.auth-buttons .btn-outline')).display,menuText:document.querySelector('.mobile-drawer').innerText})");
  assert.notEqual(guestLogin.headerLoginDisplay, 'none');
  assert.ok(guestLogin.menuText.includes('Đăng nhập'));
  assert.notEqual(heroHelp.color, 'rgba(255, 255, 255, 0.9)');
  await click('.mobile-drawer button');
  await evaluate("new Promise(resolve=>setTimeout(resolve,100))");
  assert.equal(await evaluate('location.pathname'), '/login');
  await visit('/passenger-info', "!!document.querySelector('input[name=document_number]')", 'passenger validation audit');
  await fill('select[name=document_type]', 'PASSPORT');
  await fill('input[name=document_number]', 'A');
  await evaluate("[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Tiếp tục')).click()");
  const invalidPassportAccepted = await evaluate("location.pathname==='/booking'");
  assert.equal(invalidPassportAccepted, false, 'invalid passport stays on passenger form');
  for (const value of ['ABCDE', 'A-12345', 'A'.repeat(21)]) {
    await fill('input[name=document_number]', value);
    await evaluate("[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Tiếp tục')).click()");
    assert.equal(await evaluate('location.pathname'), '/passenger-info');
  }
  await fill('input[name=document_number]', ' ab123456 ');
  await evaluate("[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Tiếp tục')).click()");
  await evaluate("new Promise(resolve=>setTimeout(resolve,100))");
  assert.equal(await evaluate('location.pathname'), '/booking');
  assert.equal(await evaluate('history.state.usr.passenger.document_number'), 'AB123456');
  let backendPassportStatus;
  try {
    require('../../backend/lib/validation').passengerData({ full_name:'Nguyen Test',gender:'MALE',date_of_birth:'2000-01-01',document_type:'PASSPORT',document_number:'A',phone:'0900000000',email:'test@example.test' });
    backendPassportStatus = 200;
  } catch (error) { backendPassportStatus = error.status; }
  const adminLayout = [];
  for (const route of ['/admin/users', '/admin/flights', '/admin/payments', '/admin/bookings']) {
    await visit(route, "!!document.querySelector('tbody tr')", 'admin clipping audit');
    adminLayout.push(await evaluate(`(()=>{const health=document.querySelector('.adm-system-health').getBoundingClientRect();const topbar=document.querySelector('.adm-topbar').getBoundingClientRect();return {route:location.pathname,healthTop:health.top,healthBottom:health.bottom,topbarBottom:topbar.bottom,clippedToolbarControls:[...document.querySelectorAll('.adm-table-toolbar input,.adm-table-toolbar select,.adm-table-toolbar button')].filter(e=>{const b=e.getBoundingClientRect();return b.right>innerWidth+1||b.left<0}).map(e=>({tag:e.tagName,text:e.options?.[e.selectedIndex]?.text||e.placeholder||e.textContent,right:e.getBoundingClientRect().right}))}})()`));
    await evaluate("document.querySelector('.admin-responsive-table tbody > tr').scrollIntoView();window.scrollBy(0,-90)");
    const shot = await command('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(runDir, `${route.replace(/[^a-z0-9]/gi,'_')}-cards-390.png`), Buffer.from(shot.data, 'base64'));
  }
  fs.writeFileSync(path.join(runDir, 'results.json'), JSON.stringify({ results, browserErrors: errors, probes:{guestLogin,heroHelp,invalidPassportAccepted,backendPassportStatus,adminLayout} }, null, 2));
  assert.equal(results.filter(r=>r.error).length, 0, 'all responsive pages render');
  assert.equal(results.filter(r=>r.pageWidth>r.viewport+1).length, 0, 'no page overflow');
  assert.deepEqual(errors, []);
  for (const layout of adminLayout) {
    assert.deepEqual(layout.clippedToolbarControls, [], `filters fit: ${layout.route}`);
    assert.ok(layout.healthTop>=0 && layout.healthBottom<=layout.topbarBottom+1, `status fits: ${layout.route}`);
  }
  console.log(JSON.stringify({ runDir, views: results.length, errors: results.filter(r=>r.error).length, overflows: results.filter(r=>r.pageWidth>r.viewport+1).length, browserErrors:errors.length }));
};
