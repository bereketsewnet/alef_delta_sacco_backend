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
import { findAccountProductByCode } from '../account-products/account-product.repository.js';
import { query, execute } from '../../core/db.js';

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
  
  // Allow account creation for PENDING and ACTIVE members
  if (member.status === 'SUSPENDED' || member.status === 'CLOSED') {
    throw httpError(400, 'Cannot open account for suspended or closed members');
  }
  
  // Verify account product exists and is active
  const product = await findAccountProductByCode(payload.product_code);
  if (!product) {
    throw httpError(404, `Account product '${payload.product_code}' not found`);
  }
  if (!product.is_active) {
    throw httpError(400, `Account product '${payload.product_code}' is not active`);
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
  
  // Cannot modify closed accounts
  if (account.status === 'CLOSED') {
    throw httpError(400, 'Cannot modify closed account');
  }
  
  // Validate product_code change
  if (payload.product_code && payload.product_code !== account.product_code) {
    const balance = Number(account.balance);
    if (balance !== 0) {
      throw httpError(400, 'Cannot change product code for account with non-zero balance');
    }
    
    // Verify new account product exists and is active
    const product = await findAccountProductByCode(payload.product_code);
    if (!product) {
      throw httpError(404, `Account product '${payload.product_code}' not found`);
    }
    if (!product.is_active) {
      throw httpError(400, `Account product '${payload.product_code}' is not active`);
    }
    
    // Check if member already has an account with the new product code
    const existing = await query(
      'SELECT * FROM accounts WHERE member_id = ? AND product_code = ? AND account_id != ? AND status != ?',
      [account.member_id, payload.product_code, accountId, 'CLOSED']
    );
    
    if (existing.length > 0) {
      throw httpError(400, 'Member already has an active account with this product');
    }
  }
  
  // Validate status transitions
  if (payload.status) {
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

export async function deleteAccount(accountId) {
  const account = await findAccountById(accountId);
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  
  if (account.status !== 'CLOSED') {
    throw httpError(400, 'Account must be closed before deletion');
  }
  
  const balance = Number(account.balance);
  if (balance !== 0) {
    throw httpError(400, `Cannot delete account with non-zero balance. Current balance: ${balance}`);
  }
  
  const lien = Number(account.lien_amount || 0);
  if (lien > 0) {
    throw httpError(400, `Cannot delete account with active lien. Lien amount: ${lien}`);
  }
  
  // Check if account has any transactions
  const transactions = await query(
    'SELECT COUNT(*) as count FROM transactions WHERE account_id = ?',
    [accountId]
  );
  
  if (transactions[0].count > 0) {
    throw httpError(400, 'Cannot delete account with transaction history. Account must remain for audit purposes.');
  }
  
  await execute('DELETE FROM accounts WHERE account_id = ?', [accountId]);
  return { success: true, message: 'Account deleted successfully' };
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
