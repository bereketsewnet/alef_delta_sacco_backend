import { query } from '../../core/db.js';

export async function findAccountById(accountId, connection) {
  const executor = connection || { query };
  const [rows] =
    connection?.query
      ? await connection.query('SELECT * FROM accounts WHERE account_id = ?', [accountId])
      : await query('SELECT * FROM accounts WHERE account_id = ?', [accountId]);
  return rows?.[0] || rows;
}

export async function listAccountsByMember(memberId) {
  return query('SELECT * FROM accounts WHERE member_id = ?', [memberId]);
}

