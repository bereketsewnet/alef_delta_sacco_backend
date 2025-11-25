import { query, execute } from '../../core/db.js';

export async function listCollateralByLoan(loanId) {
  return query('SELECT * FROM collateral WHERE loan_id = ?', [loanId]);
}

export async function addCollateral(item) {
  await execute(
    `INSERT INTO collateral
    (collateral_id, loan_id, type, description, estimated_value, document_url)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      item.collateral_id,
      item.loan_id,
      item.type,
      item.description,
      item.estimated_value,
      item.document_url
    ]
  );
}

export async function deleteCollateral(collateralId) {
  await execute('DELETE FROM collateral WHERE collateral_id = ?', [collateralId]);
}

