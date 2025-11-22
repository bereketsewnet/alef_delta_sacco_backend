import { query } from '../../core/db.js';

export async function insertTransaction(payload, connection) {
  await connection.execute(
    `INSERT INTO transactions
    (txn_id, account_id, txn_type, amount, balance_after, reference, receipt_photo_url, performed_by, idempotency_key, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      payload.txn_id,
      payload.account_id,
      payload.txn_type,
      payload.amount,
      payload.balance_after,
      payload.reference,
      payload.receipt_photo_url,
      payload.performed_by,
      payload.idempotency_key
    ]
  );
}

export async function listTransactions(filters = {}) {
  const where = [];
  const params = [];
  if (filters.account_id) {
    where.push('account_id = ?');
    params.push(filters.account_id);
  }
  if (filters.txn_type) {
    where.push('txn_type = ?');
    params.push(filters.txn_type);
  }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = Number(filters.limit || 50);
  const offset = Number(filters.offset || 0);
  return query(
    `SELECT * FROM transactions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
}

