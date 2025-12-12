import httpError from '../../core/utils/httpError.js';
import { toPublicUrl } from '../../core/utils/fileStorage.js';
import {
  createLoanRepaymentRequest,
  listLoanRepaymentRequestsByMember,
  listAllLoanRepaymentRequests,
  approveLoanRepaymentRequest,
  rejectLoanRepaymentRequest,
} from './loan-repayment-request.service.js';

export async function handleCreateLoanRepaymentRequest(req, res, next) {
  try {
    const receiptPhotoUrl = req.file ? toPublicUrl(req.file.path) : null;
    
    const request = await createLoanRepaymentRequest(req.user.memberId, {
      loan_id: req.body.loan_id,
      amount: req.body.amount,
      payment_method: req.body.payment_method,
      receipt_number: req.body.receipt_number,
      receipt_photo_url: receiptPhotoUrl,
      notes: req.body.notes,
    });

    res.status(201).json({ data: request });
  } catch (error) {
    next(error);
  }
}

export async function handleGetLoanRepaymentRequests(req, res, next) {
  try {
    // If user is staff/admin, return all requests; otherwise return member's own requests
    if (req.user.subjectType === 'MEMBER') {
      const requests = await listLoanRepaymentRequestsByMember(req.user.memberId);
      res.json({ data: requests });
    } else {
      // Staff/admin can see all requests with optional filters
      const requests = await listAllLoanRepaymentRequests({
        status: req.query.status,
        member_id: req.query.member_id,
      });
      res.json({ data: requests });
    }
  } catch (error) {
    next(error);
  }
}

export async function handleApproveLoanRepaymentRequest(req, res, next) {
  try {
    const request = await approveLoanRepaymentRequest(
      req.params.requestId,
      req.user.userId
    );
    res.json({ data: request });
  } catch (error) {
    next(error);
  }
}

export async function handleRejectLoanRepaymentRequest(req, res, next) {
  try {
    const request = await rejectLoanRepaymentRequest(
      req.params.requestId,
      req.user.userId,
      req.body.reason
    );
    res.json({ data: request });
  } catch (error) {
    next(error);
  }
}


