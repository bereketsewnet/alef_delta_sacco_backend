import httpError from '../../core/utils/httpError.js';
import { query, execute } from '../../core/db.js';
import { findMemberById } from '../members/member.repository.js';

export async function verifyGuarantor(guarantorId, actor, payload) {
  const rows = await query('SELECT * FROM guarantors WHERE guarantor_id = ?', [guarantorId]);
  const guarantor = rows[0];
  if (!guarantor) {
    throw httpError(404, 'Guarantor not found');
  }
  
  // Check guarantor member exists and is active
  const guarantorMember = await findMemberById(guarantor.guarantor_member_id);
  if (!guarantorMember) {
    throw httpError(400, 'Guarantor member not found');
  }
  if (guarantorMember.status !== 'ACTIVE') {
    throw httpError(400, 'Guarantor member is not active');
  }
  
  // Check guarantor's own savings/capacity
  const savingsRows = await query(
    'SELECT SUM(balance) as total_savings FROM accounts WHERE member_id = ? AND product_code LIKE ?',
    [guarantor.guarantor_member_id, 'SAV_%']
  );
  const totalSavings = Number(savingsRows[0]?.total_savings || 0);
  
  // Check existing guarantee commitments
  const existingRows = await query(
    `SELECT SUM(guaranteed_amount) as total_guaranteed 
     FROM guarantors g
     JOIN loan_applications l ON g.loan_id = l.loan_id
     WHERE g.guarantor_member_id = ? 
     AND l.workflow_status IN ('APPROVED', 'DISBURSED')
     AND g.guarantor_id != ?`,
    [guarantor.guarantor_member_id, guarantorId]
  );
  const totalGuaranteed = Number(existingRows[0]?.total_guaranteed || 0);
  
  const availableCapacity = totalSavings - totalGuaranteed;
  const canGuarantee = availableCapacity >= Number(guarantor.guaranteed_amount);
  
  await execute(
    `UPDATE guarantors 
     SET verification_status = ?, 
         verified_by = ?, 
         verified_at = NOW(), 
         verification_notes = ?,
         available_capacity = ?
     WHERE guarantor_id = ?`,
    [
      canGuarantee && payload.status !== 'REJECTED' ? 'VERIFIED' : 'REJECTED',
      actor.userId,
      payload.notes || (canGuarantee ? 'Capacity verified' : 'Insufficient capacity'),
      availableCapacity,
      guarantorId
    ]
  );
  
  const updated = await query('SELECT * FROM guarantors WHERE guarantor_id = ?', [guarantorId]);
  return {
    ...updated[0],
    guarantor_member: guarantorMember,
    total_savings: totalSavings,
    total_guaranteed: totalGuaranteed,
    available_capacity: availableCapacity
  };
}

export async function listGuarantorsForLoan(loanId) {
  const guarantors = await query('SELECT * FROM guarantors WHERE loan_id = ?', [loanId]);
  const enriched = [];
  for (const g of guarantors) {
    const member = await findMemberById(g.guarantor_member_id);
    enriched.push({ ...g, guarantor_member: member });
  }
  return enriched;
}

export async function getGuarantorSummary(loanId) {
  const guarantors = await listGuarantorsForLoan(loanId);
  const totalGuaranteed = guarantors.reduce((sum, g) => sum + Number(g.guaranteed_amount || 0), 0);
  const allVerified = guarantors.every(g => g.verification_status === 'VERIFIED');
  
  return {
    guarantors,
    total_guaranteed: totalGuaranteed,
    all_verified: allVerified,
    count: guarantors.length
  };
}

