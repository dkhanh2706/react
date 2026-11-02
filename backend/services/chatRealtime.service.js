const { WebSocketServer, WebSocket } = require('ws');
const { authenticateToken } = require('../middleware/auth.middleware');
const live = require('./liveChat.service');
const events = require('./chatEvents');
const crypto = require('node:crypto');

const admins = new Map();
const signedOut = new Map();
const fingerprint = token => crypto.createHash('sha256').update(token).digest('hex');
const count = id => admins.get(id)?.size || 0;

async function touchAdmin(id) {
  await live.transaction(async client => {
    if (!count(id)) return;
    await live.sweep(client); // Expired ownership must be released before reconnecting.
    const old = (await client.query('SELECT last_seen FROM chat_presence WHERE admin_id=$1', [id])).rows[0];
    await client.query(`INSERT INTO chat_presence(admin_id) VALUES($1)
      ON CONFLICT(admin_id) DO UPDATE SET last_seen=now()`, [id]);
    if (!old || Date.now() - +new Date(old.last_seen) >= live.PRESENCE_LEASE_MS) client.chatChanged = true;
    const restored = await client.query("UPDATE chat_conversations SET disconnected_at=NULL WHERE admin_id=$1 AND status='active' AND disconnected_at IS NOT NULL RETURNING id", [id]);
    for (const c of restored.rows) await live.message(client, c.id, 'system', 'Nhân viên đã kết nối lại và tiếp tục hỗ trợ bạn.');
  });
}

async function disconnected(id) {
  await live.transaction(async client => {
    if (count(id)) return;
    // Expire availability immediately on the last socket closing, while retaining
    // the admin's deliberate on/off choice for reconnection during the grace period.
    await client.query("UPDATE chat_presence SET last_seen=now()-($2 * interval '1 millisecond') WHERE admin_id=$1", [id, live.PRESENCE_LEASE_MS]);
    client.chatChanged = true;
    const lost = await client.query("UPDATE chat_conversations SET disconnected_at=COALESCE(disconnected_at,now()) WHERE admin_id=$1 AND status='active' AND disconnected_at IS NULL RETURNING id", [id]);
    for (const c of lost.rows) await live.message(client, c.id, 'system', `Nhân viên đang mất kết nối. Vui lòng chờ tối đa ${live.ADMIN_RECONNECT_GRACE_MS / 1000} giây; bạn vẫn có thể gửi tin nhắn.`);
  });
}

function signOutAdmin(id, token) {
  const connections = admins.get(id);
  const tokens = new Set([token, ...Array.from(connections || [], ws => ws.token)]);
  for (const value of tokens) if (value) {
    // A signed-out chat session cannot reconnect with its old credential.
    const exp = require('jsonwebtoken').decode(value)?.exp;
    signedOut.set(fingerprint(value), exp ? exp * 1000 : Date.now() + 86400000);
  }
  for (const ws of connections || []) ws.close(4001, 'Signed out');
}

function attachChatRealtime(server, { allowedOrigins, path = '/api/chat/live' }) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 8192 });
  const onUpgrade = (req, socket, head) => {
    if (req.url?.split('?')[0] !== path) return;
    if (!allowedOrigins.includes(req.headers.origin)) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      return;
    }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
  };
  server.on('upgrade', onUpgrade);

  wss.on('connection', ws => {
    ws.alive = true;
    ws.authenticating = false;
    const authTimer = setTimeout(() => ws.close(4401, 'Authentication required'), 5000);
    authTimer.unref();
    ws.on('error', () => {});
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', async raw => {
      if (ws.authenticated || ws.authenticating) return;
      ws.authenticating = true;
      try {
        const data = JSON.parse(raw.toString());
        if (data.type !== 'auth') throw new Error('Authentication required');
        if (data.token) {
          if (typeof data.token !== 'string' || signedOut.has(fingerprint(data.token))) throw new Error('Signed out');
          const user = await authenticateToken(data.token);
          if (user.role !== 'ADMIN') throw new Error('Admin required');
          if (ws.readyState !== WebSocket.OPEN) return;
          ws.adminId = user.id;
          ws.token = data.token;
          if (!admins.has(user.id)) admins.set(user.id, new Set());
          admins.get(user.id).add(ws);
          await touchAdmin(user.id);
        } else {
          await live.transaction(client => live.visitor(client, data));
          ws.visitor = { id: data.id, secret: data.secret };
        }
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.authenticated = true;
        clearTimeout(authTimer);
        ws.send(JSON.stringify({ type: 'ready' }));
      } catch (error) {
        if (error.code || error.status >= 500) ws.close(1011, 'Chat temporarily unavailable');
        else ws.close(4401, 'Invalid session');
      }
    });
    ws.on('close', () => {
      clearTimeout(authTimer);
      if (ws.adminId) {
        const group = admins.get(ws.adminId);
        group?.delete(ws);
        if (!group?.size) admins.delete(ws.adminId);
        disconnected(ws.adminId).catch(error => console.error('CHAT DISCONNECT:', error.message));
      }
    });
  });

  // Server-side ping/pong works while the browser tab is in the background.
  let checking = false;
  let availability = '';
  const timer = setInterval(async () => {
    if (checking) return;
    checking = true;
    try {
      const online = new Set();
      for (const ws of wss.clients) {
        if (!ws.alive) { ws.terminate(); continue; }
        ws.alive = false;
        ws.ping();
        if (ws.authenticated && ws.adminId) {
          try {
            const user = await authenticateToken(ws.token);
            if (user.role !== 'ADMIN') throw Object.assign(new Error('Admin required'), { status: 401 });
            online.add(ws.adminId);
          } catch (error) {
            if (error.status === 401) ws.close(4401, 'Session expired');
            // On database errors let the presence lease expire naturally.
          }
        }
      }
      for (const id of online) await touchAdmin(id);
      const current = await live.transaction(async client => (await client.query(`SELECT p.admin_id FROM chat_presence p
        JOIN users u ON u.id=p.admin_id WHERE p.available AND p.last_seen>now()-($1 * interval '1 millisecond')
        AND u.role='ADMIN' AND NOT u.is_locked ORDER BY p.admin_id`, [live.PRESENCE_LEASE_MS])).rows.map(row => row.admin_id).join(','));
      // Also announce leases expiring after a backend restart, when no old socket
      // remains in memory to emit a close event.
      if (current !== availability) { availability = current; events.emit('changed'); }
      for (const [key, expires] of signedOut) if (expires <= Date.now()) signedOut.delete(key);
    } catch (error) { console.error('CHAT HEARTBEAT:', error.message); }
    finally { checking = false; }
  }, 5000);
  timer.unref();
  const broadcast = () => {
    for (const ws of wss.clients) if (ws.authenticated && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'changed' }));
  };
  events.on('changed', broadcast);
  const deleted = id => {
    for (const ws of wss.clients) {
      if (ws.authenticated && ws.visitor?.id === id && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'deleted', id }));
        ws.close(4002, 'Conversation deleted');
      }
    }
  };
  events.on('deleted', deleted);
  let stopped = false;
  const close = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    events.off('changed', broadcast);
    events.off('deleted', deleted);
    server.off('upgrade', onUpgrade);
    for (const ws of wss.clients) ws.terminate();
    wss.close();
  };
  server.once('close', close);
  return { close };
}

module.exports = { attachChatRealtime, signOutAdmin };
