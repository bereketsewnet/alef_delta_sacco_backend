import httpError from '../../core/utils/httpError.js';
import { query } from '../../core/db.js';
import { findMemberById } from '../members/member.repository.js';
import { listTransactions } from '../transactions/transaction.repository.js';

export async function getClientProfile(memberId) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  
  // Get account summaries
  const accounts = await query('SELECT * FROM accounts WHERE member_id = ?', [memberId]);
  const totalSavings = accounts
    .filter(a => a.product_code.startsWith('SAV_'))
    .reduce((sum, a) => sum + Number(a.balance), 0);
  
  // Get active loans
  const loans = await query(
    'SELECT * FROM loan_applications WHERE member_id = ? AND workflow_status IN (?, ?)',
    [memberId, 'APPROVED', 'DISBURSED']
  );
  const totalLoanOutstanding = loans.reduce((sum, l) => sum + Number(l.approved_amount || 0), 0);
  
  // Get next payment
  const nextPayment = loans.length > 0 ? loans[0].next_payment_date : null;
  
  return {
    member: {
      member_id: member.member_id,
      membership_no: member.membership_no,
      first_name: member.first_name,
      middle_name: member.middle_name,
      last_name: member.last_name,
      phone_primary: member.phone_primary,
      email: member.email,
      status: member.status,
      registered_date: member.registered_date
    },
    summary: {
      total_savings: totalSavings,
      total_loan_outstanding: totalLoanOutstanding,
      next_payment_date: nextPayment,
      active_loans_count: loans.length
    }
  };
}

export async function getClientAccounts(memberId) {
  const accounts = await query('SELECT * FROM accounts WHERE member_id = ?', [memberId]);
  return accounts.map(a => ({
    account_id: a.account_id,
    product_code: a.product_code,
    balance: a.balance,
    lien_amount: a.lien_amount,
    available_balance: Number(a.balance) - Number(a.lien_amount || 0),
    currency: a.currency,
    status: a.status,
    created_at: a.created_at
  }));
}

export async function getClientAccountTransactions(memberId, accountId, filters = {}) {
  // Verify account belongs to member
  const accountRows = await query('SELECT * FROM accounts WHERE account_id = ? AND member_id = ?', [accountId, memberId]);
  if (accountRows.length === 0) {
    throw httpError(403, 'Account does not belong to this member');
  }
  
  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  
  const transactions = await listTransactions({ account_id: accountId, limit, offset });
  return transactions;
}

export async function getClientLoans(memberId) {
  const loans = await query('SELECT * FROM loan_applications WHERE member_id = ? ORDER BY created_at DESC', [memberId]);
  return loans.map(l => ({
    loan_id: l.loan_id,
    product_code: l.product_code,
    applied_amount: l.applied_amount,
    approved_amount: l.approved_amount,
    term_months: l.term_months,
    interest_rate: l.interest_rate,
    workflow_status: l.workflow_status,
    disbursement_date: l.disbursement_date,
    next_payment_date: l.next_payment_date,
    created_at: l.created_at
  }));
}

export async function getClientLoanSchedule(memberId, loanId) {
  // Verify loan belongs to member
  const loanRows = await query('SELECT * FROM loan_applications WHERE loan_id = ? AND member_id = ?', [loanId, memberId]);
  if (loanRows.length === 0) {
    throw httpError(403, 'Loan does not belong to this member');
  }
  
  const loan = loanRows[0];
  
  // Import schedule builder
  const { buildSchedule } = await import('../loans/gatekeeper.js');
  const schedule = buildSchedule(loan, loan.disbursement_date || new Date());
  
  return {
    loan: {
      loan_id: loan.loan_id,
      product_code: loan.product_code,
      approved_amount: loan.approved_amount,
      term_months: loan.term_months,
      interest_rate: loan.interest_rate,
      interest_type: loan.interest_type
    },
    schedule
  };
}

