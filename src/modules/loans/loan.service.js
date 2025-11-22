import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import httpError from '../../core/utils/httpError.js';
import { findMemberById } from '../members/member.repository.js';
import {
  findLoanProductByCode,
  createLoanApplication,
  findLoanById,
  updateLoan
} from './loan.repository.js';
import { withTransaction } from '../../core/db.js';
import { findAccountById } from '../accounts/account.repository.js';
import { updateAccountBalance } from '../accounts/account.service.js';
import { insertAuditLog } from '../admin/audit.repository.js';
import { addGuarantor } from '../guarantors/guarantor.repository.js';
import { addCollateral } from '../collateral/collateral.repository.js';
import { toPublicUrl } from '../../core/utils/fileStorage.js';
import {
  calculateInstallment,
  runGatekeeper,
  buildSchedule as buildScheduleHelper
} from './gatekeeper.js';

export async function createLoan(payload) {
  const member = await findMemberById(payload.member_id);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  const product = await findLoanProductByCode(payload.product_code);
  if (!product) {
    throw httpError(400, 'Loan product not found');
  }
  const gatekeeperResult = runGatekeeper(member, payload, product);
  const loanId = uuid();
  await createLoanApplication({
    loan_id: loanId,
    member_id: payload.member_id,
    product_code: payload.product_code,
    applied_amount: payload.applied_amount,
    approved_amount: null,
    term_months: payload.term_months,
    interest_rate: payload.interest_rate || product.interest_rate,
    interest_type: payload.interest_type || product.interest_type,
    purpose_description: payload.purpose_description,
    repayment_frequency: payload.repayment_frequency || 'MONTHLY',
    workflow_status: gatekeeperResult.passed ? 'UNDER_REVIEW' : 'PENDING'
  });
  await updateLoan(loanId, { eligibility_snapshot: JSON.stringify(gatekeeperResult) });
  return findLoanById(loanId);
}

export async function checkLoanEligibility(loanId) {
  const loan = await findLoanById(loanId);
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  const member = await findMemberById(loan.member_id);
  const product = await findLoanProductByCode(loan.product_code);
  const result = runGatekeeper(
    member,
    {
      applied_amount: loan.applied_amount,
      interest_rate: loan.interest_rate,
      interest_type: loan.interest_type,
      term_months: loan.term_months
    },
    product
  );
  await updateLoan(loanId, { eligibility_snapshot: JSON.stringify(result) });
  return result;
}

export async function approveLoan(loanId, payload, actor) {
  if (!['ADMIN', 'MANAGER', 'CREDIT_OFFICER'].includes(actor.role)) {
    throw httpError(403, 'Only credit roles can approve loans');
  }
  const loan = await findLoanById(loanId);
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  if (loan.workflow_status === 'APPROVED') {
    throw httpError(400, 'Loan already approved');
  }
  return withTransaction(async (connection) => {
    if (payload.lien_amount && payload.lien_account_id) {
      const [rows] = await connection.query('SELECT * FROM accounts WHERE account_id = ?', [
        payload.lien_account_id
      ]);
      const account = rows[0];
      if (!account) {
        throw httpError(404, 'Lien account not found');
      }
      await updateAccountBalance(
        account.account_id,
        account.version,
        { balance: account.balance, lien_amount: Number(account.lien_amount || 0) + Number(payload.lien_amount) },
        connection
      );
    }
    await updateLoan(
      loanId,
      {
        workflow_status: 'APPROVED',
        approved_amount: payload.approved_amount || loan.applied_amount,
        interest_rate: payload.interest_rate || loan.interest_rate,
        term_months: payload.term_months || loan.term_months,
        disbursement_date: payload.disbursement_date || dayjs().format('YYYY-MM-DD'),
        next_payment_date: dayjs(payload.disbursement_date || dayjs()).add(1, 'month').format('YYYY-MM-DD')
      },
      connection
    );
    await insertAuditLog({
      userId: actor.userId,
      action: 'APPROVE_LOAN',
      entity: 'loan_applications',
      entityId: loanId,
      metadata: payload
    });
    return findLoanById(loanId, connection);
  });
}

export function buildSchedule({ loan, startDate }) {
  return buildScheduleHelper(loan, startDate);
}

export { calculateInstallment } from './gatekeeper.js';

export async function getLoanOrFail(loanId) {
  const loan = await findLoanById(loanId);
  if (!loan) {
    throw httpError(404, 'Loan not found');
  }
  return loan;
}

export async function addLoanGuarantor(loanId, payload, files) {
  await getLoanOrFail(loanId);
  await addGuarantor({
    guarantor_id: uuid(),
    loan_id: loanId,
    guarantor_member_id: payload.guarantor_member_id,
    guaranteed_amount: payload.guaranteed_amount,
    id_front_url: files?.id_front?.[0] ? toPublicUrl(files.id_front[0].path) : null,
    id_back_url: files?.id_back?.[0] ? toPublicUrl(files.id_back[0].path) : null
  });
  return { success: true };
}

export async function addLoanCollateral(loanId, payload, files) {
  await getLoanOrFail(loanId);
  await addCollateral({
    collateral_id: uuid(),
    loan_id: loanId,
    type: payload.type,
    description: payload.description,
    estimated_value: payload.estimated_value,
    document_url: files?.document?.[0] ? toPublicUrl(files.document[0].path) : null
  });
  return { success: true };
}

