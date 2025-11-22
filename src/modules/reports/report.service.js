import { query } from '../../core/db.js';

export async function getOperationalSummary() {
  const [memberStats] = await query('SELECT COUNT(*) AS total_members FROM members');
  const [accountStats] = await query('SELECT COUNT(*) AS total_accounts, SUM(balance) AS total_balance FROM accounts');
  const [loanStats] = await query(
    'SELECT COUNT(*) AS total_loans, SUM(applied_amount) AS total_requested, SUM(approved_amount) AS total_approved FROM loan_applications'
  );
  const [txnStats] = await query(
    `SELECT
      SUM(CASE WHEN txn_type = 'DEPOSIT' THEN amount ELSE 0 END) AS total_deposits,
      SUM(CASE WHEN txn_type = 'WITHDRAWAL' THEN amount ELSE 0 END) AS total_withdrawals
    FROM transactions`
  );
  return {
    members: memberStats.total_members || 0,
    accounts: accountStats.total_accounts || 0,
    totalBalance: Number(accountStats.total_balance || 0),
    loans: {
      total: loanStats.total_loans || 0,
      requested: Number(loanStats.total_requested || 0),
      approved: Number(loanStats.total_approved || 0)
    },
    transactions: {
      deposits: Number(txnStats.total_deposits || 0),
      withdrawals: Number(txnStats.total_withdrawals || 0)
    }
  };
}

