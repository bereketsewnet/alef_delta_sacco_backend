import { query } from '../../core/db.js';

export async function getOperationalSummary() {
  const [memberStats] = await query("SELECT COUNT(*) AS total_members, SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_members FROM members");
  const [accountStats] = await query('SELECT COUNT(*) AS total_accounts, SUM(balance) AS total_balance FROM accounts');
  
  // Loans outstanding: Sum of approved amount for active loans (simplified)
  const [loanStats] = await query(
    "SELECT COUNT(*) AS total_loans, SUM(approved_amount) AS total_outstanding FROM loan_applications WHERE workflow_status = 'DISBURSED'"
  );
  
  const [pendingLoans] = await query(
    "SELECT COUNT(*) as count FROM loan_applications WHERE workflow_status IN ('SUBMITTED', 'REVIEW')"
  );

  // Monthly deposits (current month)
  const [monthlyStats] = await query(
    `SELECT SUM(amount) as monthly_deposits 
     FROM transactions 
     WHERE txn_type = 'DEPOSIT' 
     AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`
  );

  return {
    total_savings: Number(accountStats.total_balance || 0),
    total_loans_outstanding: Number(loanStats.total_outstanding || 0),
    monthly_deposits: Number(monthlyStats.monthly_deposits || 0),
    delinquency_rate: 0, // Placeholder
    active_members: Number(memberStats.active_members || 0),
    pending_approvals: Number(pendingLoans.count || 0),
    // Keep original fields for compatibility if needed
    members: memberStats.total_members || 0,
    accounts: accountStats.total_accounts || 0
  };
}

export async function getTransactionStats(startDate, endDate) {
  const start = startDate || new Date(new Date().getFullYear(), 0, 1); // Default to start of current year
  const end = endDate || new Date();

  // Group by Month
  const rows = await query(
    `SELECT 
       DATE_FORMAT(created_at, '%b') as month,
       SUM(CASE WHEN txn_type = 'DEPOSIT' THEN amount ELSE 0 END) as deposits,
       SUM(CASE WHEN txn_type = 'WITHDRAWAL' THEN amount ELSE 0 END) as withdrawals
     FROM transactions
     WHERE created_at BETWEEN ? AND ?
     GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
     ORDER BY DATE_FORMAT(created_at, '%Y-%m')`,
    [start, end]
  );
  
  return rows.map(r => ({
    month: r.month,
    deposits: Number(r.deposits),
    withdrawals: Number(r.withdrawals)
  }));
}

export async function getTellerDashboardStats(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's deposits
  const [todayDeposits] = await query(
    `SELECT 
      SUM(amount) as total,
      COUNT(*) as count
     FROM transactions 
     WHERE txn_type = 'DEPOSIT' 
     AND DATE(created_at) = CURDATE()
     AND performed_by = ?`,
    [userId]
  );

  // Today's withdrawals
  const [todayWithdrawals] = await query(
    `SELECT 
      SUM(amount) as total,
      COUNT(*) as count
     FROM transactions 
     WHERE txn_type = 'WITHDRAWAL' 
     AND DATE(created_at) = CURDATE()
     AND performed_by = ?`,
    [userId]
  );

  // Cash drawer (net: deposits - withdrawals for today)
  const netCash = Number(todayDeposits.total || 0) - Number(todayWithdrawals.total || 0);

  // Pending receipts (transactions without receipt photo uploaded today)
  const [pendingReceipts] = await query(
    `SELECT COUNT(*) as count
     FROM transactions 
     WHERE DATE(created_at) = CURDATE()
     AND performed_by = ?
     AND (receipt_photo_url IS NULL OR receipt_photo_url = '')`,
    [userId]
  );

  // Recent transactions (last 5 for this teller)
  const recentTransactions = await query(
    `SELECT 
      t.txn_id,
      t.txn_type,
      t.amount,
      t.reference,
      t.created_at,
      t.receipt_photo_url,
      a.product_code,
      m.first_name,
      m.last_name,
      m.membership_no
     FROM transactions t
     JOIN accounts a ON t.account_id = a.account_id
     JOIN members m ON a.member_id = m.member_id
     WHERE t.performed_by = ?
     ORDER BY t.created_at DESC
     LIMIT 5`,
    [userId]
  );

  return {
    today_deposits: {
      total: Number(todayDeposits.total || 0),
      count: Number(todayDeposits.count || 0)
    },
    today_withdrawals: {
      total: Number(todayWithdrawals.total || 0),
      count: Number(todayWithdrawals.count || 0)
    },
    cash_drawer: netCash,
    pending_receipts: Number(pendingReceipts.count || 0),
    recent_transactions: recentTransactions.map(t => ({
      txn_id: t.txn_id,
      txn_type: t.txn_type,
      amount: Number(t.amount),
      reference: t.reference,
      created_at: t.created_at,
      receipt_photo_url: t.receipt_photo_url,
      product_code: t.product_code,
      member_name: `${t.first_name} ${t.last_name}`,
      membership_no: t.membership_no
    }))
  };
}


