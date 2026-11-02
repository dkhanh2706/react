const crypto = require('node:crypto');
const db = require('../config/database');

// Change this value to adjust the wait AFTER a lost connection is detected.
// Agreed behavior: 60 seconds, then release ownership and let the bot answer.
const ADMIN_RECONNECT_GRACE_MS = 60_000;
const PRESENCE_LEASE_MS = 15_000; // Heartbeats arrive every 5 seconds.
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const fail = (status, message) => Object.assign(new Error(message), { status });

// Short transactions serialize state changes, never AI network calls. This also
// prevents two admins claiming one conversation or a stale bot response leaking.
async function transaction(work) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    client.chatChanged = false;
    client.deletedChats = new Set();
    await client.query('SELECT pg_advisory_xact_lock(7240331)');
    const result = await work(client);
    await client.query('COMMIT');
    for (const id of client.deletedChats) require('./chatEvents').emit('deleted', id);
    if (client.chatChanged) require('./chatEvents').emit('changed');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

async function message(client, id, sender, text, pending = false, requestId = null) {
  client.chatChanged = true;
  const inserted = await client.query(`INSERT INTO chat_messages(conversation_id,sender,text,pending,request_id)
    VALUES($1,$2,$3,$4,$5) ON CONFLICT(conversation_id,request_id) DO NOTHING RETURNING id`, [id, sender, text, pending, requestId]);
  const saved = inserted.rows[0] || (await client.query('SELECT id FROM chat_messages WHERE conversation_id=$1 AND request_id=$2', [id, requestId])).rows[0];
  await client.query('UPDATE chat_conversations SET updated_at=now() WHERE id=$1', [id]);
  return saved;
}

async function available(client) {
  const { rows } = await client.query(`SELECT 1 FROM chat_presence p JOIN users u ON u.id=p.admin_id
    WHERE p.available AND p.last_seen > now()-($1 * interval '1 millisecond')
    AND u.role='ADMIN' AND NOT u.is_locked LIMIT 1`, [PRESENCE_LEASE_MS]);
  return !!rows.length;
}

async function snapshot(client, conversation) {
  conversation = (await client.query('SELECT * FROM chat_conversations WHERE id=$1', [conversation.id])).rows[0];
  const { rows } = await client.query('SELECT id,sender,text,created_at FROM chat_messages WHERE conversation_id=$1 ORDER BY id', [conversation.id]);
  return { ...conversation, secret_hash: undefined, messages: rows, available: await available(client), reconnectGraceMs: ADMIN_RECONNECT_GRACE_MS };
}

async function visitor(client, body) {
  if (!uuid(body.id) || typeof body.secret !== 'string' || body.secret.length > 128) throw fail(403, 'Phiên chat không hợp lệ.');
  const { rows } = await client.query('SELECT * FROM chat_conversations WHERE id=$1 AND secret_hash=$2 FOR UPDATE', [body.id, hash(body.secret)]);
  if (!rows[0]) throw fail(403, 'Không có quyền truy cập cuộc chat.');
  return rows[0];
}

async function removeConversation(client, id) {
  // Foreign keys cascade to messages and read receipts. There is no archive or
  // soft-delete table; the transaction publishes only the deleted ID, no text.
  await client.query('DELETE FROM chat_conversations WHERE id=$1', [id]);
  client.deletedChats.add(id);
  client.chatChanged = true;
}

function connectionState(lastSeen, disconnectedAt, now) {
  const lostAt = disconnectedAt ? +new Date(disconnectedAt) : +new Date(lastSeen || 0) + PRESENCE_LEASE_MS;
  if (now < lostAt) return 'connected';
  return now - lostAt >= ADMIN_RECONNECT_GRACE_MS ? 'expired' : 'disconnected';
}

async function sweep(client) {
  const { rows } = await client.query(`SELECT c.*,p.last_seen,u.role,u.is_locked FROM chat_conversations c
    LEFT JOIN chat_presence p ON p.admin_id=c.admin_id LEFT JOIN users u ON u.id=c.admin_id
    WHERE c.status='active' FOR UPDATE OF c`);
  const now = Date.now();
  for (const c of rows) {
    const valid = c.role === 'ADMIN' && !c.is_locked;
    const state = valid ? connectionState(c.last_seen, c.disconnected_at, now) : 'expired';
    if (state === 'expired') {
      await client.query("UPDATE chat_conversations SET status='ended',admin_id=NULL,disconnected_at=NULL,version=version+1 WHERE id=$1", [c.id]);
      await message(client, c.id, 'system', 'Nhân viên hiện bị gián đoạn kết nối. Trợ lý tự động sẽ tiếp tục hỗ trợ bạn.');
    } else if (state === 'disconnected' && !c.disconnected_at) {
      await client.query("UPDATE chat_conversations SET disconnected_at=$2 WHERE id=$1", [c.id, new Date(+new Date(c.last_seen) + PRESENCE_LEASE_MS)]);
      await message(client, c.id, 'system', `Nhân viên đang mất kết nối. Vui lòng chờ tối đa ${ADMIN_RECONNECT_GRACE_MS / 1000} giây; bạn vẫn có thể gửi tin nhắn.`);
    }
  }
}

const generating = new Set();
async function answerPending(generateReply) {
  const { rows } = await db.query(`SELECT DISTINCT c.id FROM chat_conversations c JOIN chat_messages m ON m.conversation_id=c.id
    WHERE c.status IN ('bot','waiting','ended') AND m.pending`);
  await Promise.allSettled(rows.map(async ({ id }) => {
    if (generating.has(id)) return;
    generating.add(id);
    try {
      const context = await transaction(async client => {
        const c = (await client.query('SELECT * FROM chat_conversations WHERE id=$1', [id])).rows[0];
        if (!c || c.status === 'active') return null;
        const messages = (await client.query("SELECT * FROM chat_messages WHERE conversation_id=$1 AND sender<>'system' ORDER BY id DESC LIMIT 12", [id])).rows.reverse();
        if (!messages.some(m => m.pending)) return null;
        return { c, messages, lastId: messages.at(-1).id };
      });
      if (!context) return;
      let reply;
      try { reply = await generateReply(context.messages); }
      catch { reply = 'Trợ lý AI hiện chưa thể trả lời. Hội thoại đã có trong hộp thư nhân viên để tiếp nhận hỗ trợ bạn.'; }
      await transaction(async client => {
        const c = (await client.query('SELECT * FROM chat_conversations WHERE id=$1', [id])).rows[0];
        if (!c || c.status === 'active' || c.version !== context.c.version) return;
        // Newer customer messages will be answered by the next worker pass.
        const pending = await client.query('UPDATE chat_messages SET pending=false WHERE conversation_id=$1 AND pending AND id <= $2 RETURNING id', [id, context.lastId]);
        if (pending.rowCount) await message(client, id, 'bot', reply);
      });
    } finally { generating.delete(id); }
  }));
}

module.exports = { ADMIN_RECONNECT_GRACE_MS, PRESENCE_LEASE_MS, connectionState, uuid, hash, fail, transaction, message, snapshot, visitor, removeConversation, available, sweep, answerPending };
