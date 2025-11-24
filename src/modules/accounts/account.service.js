import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import {
  findAccountById,
  listAccountsByMember,
  listAccounts,
  countAccounts,
  createAccount as createAccountRepo,
  updateAccount as updateAccountRepo
} from './account.repository.js';
import { findMemberById } from '../members/member.repository.js';
import { query } from '../../core/db.js';

export async function getAccounts(filters) {
  const data = await listAccounts(filters);
  const total = await countAccounts(filters);
  
  // Add available balance to each account
  const enriched = data.map(account => ({
    ...account,
    available_balance: Number(account.balance) - Number(account.lien_amount || 0)
  }));
  
  return {
    data: enriched,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0
  };
}

export async function getAccountById(accountId) {
  const account = await findAccountById(accountId);
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  return {
    ...account,
    available_balance: Number(account.balance) - Number(account.lien_amount || 0)
  };
}

export async function getAccountsForMember(memberId) {
  const accounts = await listAccountsByMember(memberId);
  return accounts.map(account => ({
    ...account,
    available_balance: Number(account.balance) - Number(account.lien_amount || 0)
  }));
}

export async function createAccount(payload) {
  // Verify member exists
  const member = await findMemberById(payload.member_id);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  
  if (member.status !== 'ACTIVE') {
    throw httpError(400, 'Member must be active to open an account');
  }
  
  // Check if account with same product already exists
  const existing = await query(
    'SELECT * FROM accounts WHERE member_id = ? AND product_code = ? AND status != ?',
    [payload.member_id, payload.product_code, 'CLOSED']
  );
  
  if (existing.length > 0) {
    throw httpError(400, 'Member already has an active account with this product');
  }
  
  const accountId = uuid();
  await createAccountRepo({
    account_id: accountId,
    member_id: payload.member_id,
    product_code: payload.product_code,
    currency: payload.currency || 'ETB',
    balance: 0,
    lien_amount: 0,
    status: 'ACTIVE'
  });
  
  return getAccountById(accountId);
}

export async function updateAccount(accountId, payload) {
  const account = await findAccountById(accountId);
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  
  // Validate status transitions
  if (payload.status) {
    if (account.status === 'CLOSED') {
      throw httpError(400, 'Cannot modify closed account');
    }
    
    if (payload.status === 'CLOSED' && Number(account.balance) !== 0) {
      throw httpError(400, 'Cannot close account with non-zero balance');
    }
  }
  
  await updateAccountRepo(accountId, payload);
  return getAccountById(accountId);
}

export async function closeAccount(accountId) {
  const account = await findAccountById(accountId);
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  
  if (account.status === 'CLOSED') {
    throw httpError(400, 'Account is already closed');
  }
  
  const balance = Number(account.balance);
  if (balance !== 0) {
    throw httpError(400, `Cannot close account with non-zero balance. Current balance: ${balance}`);
  }
  
  const lien = Number(account.lien_amount || 0);
  if (lien > 0) {
    throw httpError(400, `Cannot close account with active lien. Lien amount: ${lien}`);
  }
  
  await updateAccountRepo(accountId, { status: 'CLOSED' });
  return getAccountById(accountId);
}

export async function freezeAccount(accountId) {
  const account = await findAccountById(accountId);
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  
  if (account.status === 'CLOSED') {
    throw httpError(400, 'Cannot freeze closed account');
  }
  
  await updateAccountRepo(accountId, { status: 'FROZEN' });
  return getAccountById(accountId);
}

export async function unfreezeAccount(accountId) {
  const account = await findAccountById(accountId);
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  
  if (account.status !== 'FROZEN') {
    throw httpError(400, 'Account is not frozen');
  }
  
  await updateAccountRepo(accountId, { status: 'ACTIVE' });
  return getAccountById(accountId);
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
