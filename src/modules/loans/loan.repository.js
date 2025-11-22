import { execute, query } from '../../core/db.js';

function getExecutor(connection) {
  if (connection) {
    return {
      query: (sql, params) => connection.query(sql, params),
      execute: (sql, params) => connection.execute(sql, params)
    };
  }
  return { query, execute };
}

export async function findLoanProductByCode(code) {
  const rows = await query('SELECT * FROM loan_products WHERE product_code = ?', [code]);
  return rows[0];
}

export async function createLoanApplication(record, connection) {
  const executor = getExecutor(connection);
  await executor.execute(
    `INSERT INTO loan_applications
    (loan_id, member_id, product_code, applied_amount, approved_amount, term_months, interest_rate,
    interest_type, purpose_description, repayment_frequency, workflow_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      record.loan_id,
      record.member_id,
      record.product_code,
      record.applied_amount,
      record.approved_amount,
      record.term_months,
      record.interest_rate,
      record.interest_type,
      record.purpose_description,
      record.repayment_frequency,
      record.workflow_status
    ]
  );
}

export async function findLoanById(loanId, connection) {
  const executor = getExecutor(connection);
  const [rows] = await executor.query('SELECT * FROM loan_applications WHERE loan_id = ?', [loanId]);
  return rows[0];
}

export async function updateLoan(loanId, updates, connection) {
  const executor = getExecutor(connection);
  const fields = [];
  const params = [];
  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    params.push(value);
  });
  if (!fields.length) return;
  params.push(loanId);
  await executor.execute(
    `UPDATE loan_applications SET ${fields.join(', ')}, updated_at = NOW() WHERE loan_id = ?`,
    params
  );
}

