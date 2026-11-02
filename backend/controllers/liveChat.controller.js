const crypto = require('node:crypto');
const live = require('../services/liveChat.service');
const { errorPayload } = require('../lib/errors');

const handle = work => async (req, res, next) => {
  try {
    // Express leaves body undefined for POSTs without a payload/Content-Type.
    // Heartbeats and conversation reads intentionally have no required fields.
    req.body ??= {};
    const result = await live.transaction(async client => {
      await live.sweep(client);
      return work(client, req);
    });
    res.json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json(error.status >= 500 ? errorPayload('Server error', error) : { message: error.message });
    if (error.code === '42P01') return res.status(503).json({ message: 'Chat trực tiếp chưa được cài đặt trên database (migration 007).' });
    next(error);
  }
};

async function createConversation(client) {
  const id = crypto.randomUUID();
  const secret = crypto.randomBytes(32).toString('hex');
  const { rows } = await client.query('INSERT INTO chat_conversations(id,secret_hash) VALUES($1,$2) RETURNING *', [id, live.hash(secret)]);
  await live.message(client, id, 'bot', 'Xin chào 👋 Mình là trợ lý đặt vé máy bay. Mình có thể giúp gì cho bạn?');
  return { ...await live.snapshot(client, rows[0]), secret };
}

exports.create = handle(createConversation);

exports.reset = handle(async (client, req) => {
  const c = await live.visitor(client, req.body);
  await live.removeConversation(client, c.id);
  return createConversation(client);
});

exports.sync = handle(async (client, req) => live.snapshot(client, await live.visitor(client, req.body)));

exports.send = handle(async (client, req) => {
  const c = await live.visitor(client, req.body);
  const { text, requestId } = req.body;
  if (typeof text !== 'string' || !text.trim() || text.length > 4000 || !live.uuid(requestId)) throw live.fail(400, 'Tin nhắn cần có nội dung, tối đa 4000 ký tự.');
  await live.message(client, c.id, 'user', text.trim(), c.status === 'active', requestId);
  if (c.status !== 'active' && c.status !== 'waiting') {
    await client.query("UPDATE chat_conversations SET status='waiting',admin_id=NULL,disconnected_at=NULL WHERE id=$1", [c.id]);
  }
  return live.snapshot(client, c);
});

// Local guided replies also pass through ownership/version checks on the server.
exports.bot = handle(async (client, req) => {
  const c = await live.visitor(client, req.body);
  const { text, version } = req.body;
  if (typeof text !== 'string' || !text.trim() || text.length > 10000) throw live.fail(400, 'Nội dung không hợp lệ.');
  if (c.status !== 'active' && c.version === version) await live.message(client, c.id, 'bot', text.trim());
  return live.snapshot(client, c);
});

exports.request = handle(async (client, req) => {
  const c = await live.visitor(client, req.body);
  if (c.status === 'active' || c.status === 'waiting') return live.snapshot(client, c);
  c.status = 'waiting';
  await client.query("UPDATE chat_conversations SET status='waiting',updated_at=now() WHERE id=$1", [c.id]);
  await live.message(client, c.id, 'system', 'Hội thoại đã được gửi tới nhân viên. Trong lúc chờ, bot vẫn hỗ trợ bạn.');
  return live.snapshot(client, c);
});

exports.cancel = handle(async (client, req) => {
  const c = await live.visitor(client, req.body);
  // Kept for old clients: automatic handoff cannot be cancelled by hiding the queue.
  return live.snapshot(client, c);
});

exports.adminState = handle(async (client, req) => {
  const adminId = req.user.id;
  // Sweep runs BEFORE this heartbeat, so reconnecting after expiry cannot reclaim ownership.
  const { available, readOnly = false } = req.body;
  if (available !== undefined && typeof available !== 'boolean') throw live.fail(400, 'Trạng thái không hợp lệ.');
  if (!readOnly) {
    await client.query(`INSERT INTO chat_presence(admin_id,available) VALUES($1,COALESCE($2,false))
    ON CONFLICT(admin_id) DO UPDATE SET last_seen=now(),available=COALESCE($2,chat_presence.available) RETURNING available`, [adminId, available ?? null]);
    if (available !== undefined) client.chatChanged = true;
    const reconnects = await client.query("UPDATE chat_conversations SET disconnected_at=NULL WHERE admin_id=$1 AND status='active' AND disconnected_at IS NOT NULL RETURNING id", [adminId]);
    for (const c of reconnects.rows) await live.message(client, c.id, 'system', 'Nhân viên đã kết nối lại và tiếp tục hỗ trợ bạn.');
  }
  const { rows } = await client.query('SELECT available FROM chat_presence WHERE admin_id=$1', [adminId]);
  const conversations = await client.query(`SELECT c.id,c.status,c.admin_id,c.disconnected_at,c.updated_at,
    (SELECT text FROM chat_messages WHERE conversation_id=c.id ORDER BY id DESC LIMIT 1) AS last_message,
    (SELECT count(*)::int FROM chat_messages WHERE conversation_id=c.id AND sender='user' AND id > COALESCE(
      (SELECT last_message_id FROM chat_reads WHERE conversation_id=c.id AND admin_id=$1),0)) AS unread
    FROM chat_conversations c WHERE c.status IN ('waiting','active','ended')
      OR EXISTS(SELECT FROM chat_messages m WHERE m.conversation_id=c.id AND m.sender='user')
    ORDER BY c.updated_at DESC`, [adminId]);
  return { available: rows[0]?.available || false, adminId, conversations: conversations.rows };
});

exports.logout = async (req, res, next) => {
  try {
    await live.transaction(async client => {
      await client.query("UPDATE chat_presence SET available=false,last_seen=now()-($2 * interval '1 millisecond') WHERE admin_id=$1", [req.user.id, live.PRESENCE_LEASE_MS]);
      client.chatChanged = true;
      const ended = await client.query("UPDATE chat_conversations SET status='ended',admin_id=NULL,disconnected_at=NULL,version=version+1 WHERE admin_id=$1 AND status='active' RETURNING id", [req.user.id]);
      for (const c of ended.rows) await live.message(client, c.id, 'system', 'Nhân viên đã đăng xuất. Bot sẽ tiếp tục hỗ trợ bạn.');
    });
    require('../services/chatRealtime.service').signOutAdmin(req.user.id, req.headers.authorization?.slice(7));
    res.json({ message: 'Đã ngừng hỗ trợ trực tiếp.' });
  } catch (error) { next(error); }
};

exports.adminConversation = handle(async (client, req) => {
  if (!live.uuid(req.params.id)) throw live.fail(400, 'Cuộc chat không hợp lệ.');
  const c = (await client.query('SELECT * FROM chat_conversations WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
  if (!c) throw live.fail(404, 'Không tìm thấy cuộc chat.');
  const { action, text, requestId } = req.body;
  if (action === 'delete') {
    await live.removeConversation(client, c.id);
    return { deleted: true, id: c.id };
  }
  if (action === 'accept') {
    // Accept is the only action needed to start support; availability is just a
    // presence preference and does not prevent explicitly accepting a chat.
    await client.query(`INSERT INTO chat_presence(admin_id,last_seen) VALUES($1,now())
      ON CONFLICT(admin_id) DO UPDATE SET last_seen=now()`, [req.user.id]);
    if (c.status === 'active') throw live.fail(409, 'Cuộc chat đã được tiếp nhận.');
    c.status = 'active'; c.admin_id = req.user.id; c.disconnected_at = null; c.version++;
    await client.query("UPDATE chat_conversations SET status='active',admin_id=$2,disconnected_at=NULL,version=$3 WHERE id=$1", [c.id, c.admin_id, c.version]);
    await client.query(`UPDATE chat_messages SET pending=true WHERE conversation_id=$1 AND sender='user' AND id > COALESCE(
      (SELECT max(id) FROM chat_messages WHERE conversation_id=$1 AND sender IN ('bot','admin')),0)`, [c.id]);
    await live.message(client, c.id, 'system', 'Bạn đang trò chuyện với nhân viên hỗ trợ.');
  } else if (action === 'send' || action === 'end') {
    if (c.status !== 'active' || c.admin_id !== req.user.id) throw live.fail(409, 'Bạn cần tiếp nhận cuộc chat này trước.');
    if (action === 'send') {
      if (typeof text !== 'string' || !text.trim() || text.length > 4000 || !live.uuid(requestId)) throw live.fail(400, 'Tin nhắn không hợp lệ, tối đa 4000 ký tự.');
      const saved = await live.message(client, c.id, 'admin', text.trim(), false, requestId);
      await client.query('UPDATE chat_messages SET pending=false WHERE conversation_id=$1 AND id<$2', [c.id, saved.id]);
    } else {
      c.status = 'ended'; c.admin_id = null; c.version++;
      await client.query("UPDATE chat_conversations SET status='ended',admin_id=NULL,disconnected_at=NULL,version=$2 WHERE id=$1", [c.id, c.version]);
      await live.message(client, c.id, 'system', 'Nhân viên đã kết thúc hỗ trợ. Bot sẽ tiếp tục hỗ trợ bạn.');
    }
  } else if (action !== undefined) throw live.fail(400, 'Thao tác không hợp lệ.');
  const read = await client.query(`INSERT INTO chat_reads(admin_id,conversation_id,last_message_id)
    SELECT $1,$2,COALESCE(max(id),0) FROM chat_messages WHERE conversation_id=$2
    ON CONFLICT(admin_id,conversation_id) DO UPDATE SET last_message_id=EXCLUDED.last_message_id
    WHERE chat_reads.last_message_id<EXCLUDED.last_message_id`, [req.user.id, c.id]);
  if (read.rowCount) client.chatChanged = true;
  return live.snapshot(client, c);
});

exports.startWorker = () => {
  let busy = false;
  let answering = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      await live.transaction(live.sweep);
      // Keep detecting expired connections every 3 seconds even when Groq is slow.
      if (!answering) {
        answering = true;
        live.answerPending(require('./chat.controller').generateReply)
          .catch(error => console.error('LIVE CHAT AI:', error.message))
          .finally(() => { answering = false; });
      }
    } catch (error) {
      // The existing bot stays usable until the owner applies the additive migration.
      if (error.code !== '42P01') console.error('LIVE CHAT WORKER:', error.message);
    } finally { busy = false; }
  };
  const timer = setInterval(tick, 3000);
  timer.unref();
  return timer;
};
