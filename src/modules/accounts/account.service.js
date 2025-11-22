import httpError from '../../core/utils/httpError.js';
import { findAccountById, listAccountsByMember } from './account.repository.js';

export async function getAccountById(accountId) {
  const account = await findAccountById(accountId);
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  return account;
}

export async function getAccountsForMember(memberId) {
  return listAccountsByMember(memberId);
}

export async function updateAccountBalance(accountId, expectedVersion, updates, connection) {
  if (!connection) {
    throw new Error('Connection required for balance update');
  }
  const fields = ['balance = ?'];
  const params = [updates.balance];
  if (typeof updates.lien_amount === 'number') {
    fields.push('lien_amount = ?');
    params.push(updates.lien_amount);
  }
  params.push(accountId, expectedVersion);
  const [result] = await connection.execute(
    `UPDATE accounts SET ${fields.join(', ')}, version = version + 1
     WHERE account_id = ? AND version = ?`,
    params
  );
  if (result.affectedRows === 0) {
    const [latest] = await connection.query('SELECT * FROM accounts WHERE account_id = ?', [accountId]);
    throw httpError(409, 'Account version conflict', { account: latest[0] });
  }
  return true;
}

