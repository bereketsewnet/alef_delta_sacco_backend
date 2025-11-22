import { query, execute } from '../../core/db.js';

export async function listGuarantorsByLoan(loanId) {
  return query('SELECT * FROM guarantors WHERE loan_id = ?', [loanId]);
}

export async function addGuarantor(payload) {
  await execute(
    `INSERT INTO guarantors
    (guarantor_id, loan_id, guarantor_member_id, guaranteed_amount, id_front_url, id_back_url)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      payload.guarantor_id,
      payload.loan_id,
      payload.guarantor_member_id,
      payload.guaranteed_amount,
      payload.id_front_url,
      payload.id_back_url
    ]
  );
}

