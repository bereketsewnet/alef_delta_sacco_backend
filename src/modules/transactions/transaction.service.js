import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import { withTransaction } from '../../core/db.js';
import { updateAccountBalance } from '../accounts/account.service.js';
import { insertTransaction, listTransactions, listTransactionsByMember, findTransactionById, updateTransactionReceipt } from './transaction.repository.js';
import { insertAuditLog } from '../admin/audit.repository.js';

async function getAccountForUpdate(accountId, connection) {
  const [rows] = await connection.query('SELECT * FROM accounts WHERE account_id = ?', [accountId]);
  const account = rows[0];
  if (!account) {
    throw httpError(404, 'Account not found');
  }
  return account;
}

export async function getTransactions(filters) {
  return listTransactions(filters);
}

export async function getMemberTransactions(memberId, filters = {}) {
  return listTransactionsByMember(memberId, filters);
}

export async function updateTransactionReceiptPhoto(txnId, receiptPhotoUrl) {
  const transaction = await findTransactionById(txnId);
  if (!transaction) {
    throw httpError(404, 'Transaction not found');
  }
  
  await updateTransactionReceipt(txnId, receiptPhotoUrl);
  return { ...transaction, receipt_photo_url: receiptPhotoUrl };
}

export async function deposit({ accountId, amount, reference, receiptPhotoUrl, performedBy, idempotencyKey }) {
  if (!accountId) {
    throw httpError(400, 'account_id is required');
  }
  
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    throw httpError(400, 'Amount must be greater than zero');
  }
  
  return withTransaction(async (connection) => {
    const account = await getAccountForUpdate(accountId, connection);
    const newBalance = Number(account.balance) + numericAmount;
    await updateAccountBalance(
      accountId,
      account.version,
      { balance: newBalance },
      connection
    );
    const txn = {
      txn_id: uuid(),
      account_id: accountId,
      txn_type: 'DEPOSIT',
      amount: numericAmount,
      balance_after: newBalance,
      reference,
      receipt_photo_url: receiptPhotoUrl,
      performed_by: performedBy,
      idempotency_key: idempotencyKey
    };
    await insertTransaction(txn, connection);
    await insertAuditLog({
      userId: performedBy !== 'SYSTEM' ? performedBy : null,
      action: 'DEPOSIT',
      entity: 'accounts',
      entityId: accountId,
      metadata: { amount: numericAmount, reference }
    });
    return txn;
  });
}

export async function withdraw({ accountId, amount, reference, receiptPhotoUrl, performedBy, idempotencyKey }) {
  if (!accountId) {
    throw httpError(400, 'account_id is required');
  }
  
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    throw httpError(400, 'Amount must be greater than zero');
  }
  
  return withTransaction(async (connection) => {
    const account = await getAccountForUpdate(accountId, connection);
    const available = Number(account.balance) - Number(account.lien_amount || 0);
    if (available < numericAmount) {
      throw httpError(400, 'Insufficient available balance', { available });
    }
    const newBalance = Number(account.balance) - numericAmount;
    await updateAccountBalance(
      accountId,
      account.version,
      { balance: newBalance },
      connection
    );
    const txn = {
      txn_id: uuid(),
      account_id: accountId,
      txn_type: 'WITHDRAWAL',
      amount: numericAmount,
      balance_after: newBalance,
      reference,
      receipt_photo_url: receiptPhotoUrl,
      performed_by: performedBy,
      idempotency_key: idempotencyKey
    };
    await insertTransaction(txn, connection);
    await insertAuditLog({
      userId: performedBy !== 'SYSTEM' ? performedBy : null,
      action: 'WITHDRAWAL',
      entity: 'accounts',
      entityId: accountId,
      metadata: { amount: numericAmount, reference }
    });
    return txn;
  });
}

