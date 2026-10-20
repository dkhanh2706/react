// Read-only startup check. Schema changes are applied manually by the owner.
async function assertSchemaReady(db) {
  const required = {
    users: ["token_version", "is_primary_admin"],
    bookings: ["cancelled_at", "cancellation_reason"],
    payments: ["momo_order_id", "momo_request_id", "provider_result_code", "provider_message", "pay_url"],
    password_challenges: ["id", "user_id", "purpose", "code_hash", "attempts", "expires_at", "consumed_at"],
    payment_review_cases: ["id", "payment_id", "booking_id", "reason", "status", "refund_reference", "resolved_by"],
  };
  const { rows } = await db.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=ANY($1::text[])", [Object.keys(required)]);
  const present = new Set(rows.map(r => `${r.table_name}.${r.column_name}`));
  const missing = Object.entries(required).flatMap(([table, columns]) => columns.filter(c => !present.has(`${table}.${c}`)).map(c => `${table}.${c}`));
  const enums = await db.query("SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='booking_status'");
  for (const label of ["EXPIRED", "PAYMENT_REVIEW"]) {
    if (!enums.rows.some(r => r.enumlabel === label)) missing.push(`booking_status.${label}`);
  }
  if (missing.length) throw new Error(`Database migration required: backend/migrations/001_account_booking_safety.sql (run manually as postgres). Missing: ${missing.join(", ")}`);
}

module.exports = { assertSchemaReady };
