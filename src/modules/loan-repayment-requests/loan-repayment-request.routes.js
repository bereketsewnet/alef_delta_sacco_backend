import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { attachUploadContext, upload } from '../../core/middleware/upload.js';
import {
  handleCreateLoanRepaymentRequest,
  handleGetLoanRepaymentRequests,
  handleApproveLoanRepaymentRequest,
  handleRejectLoanRepaymentRequest,
} from './loan-repayment-request.controller.js';

const router = Router();

// Member endpoints
router.post(
  '/',
  authenticate,
  attachUploadContext('loan-repayment-requests', (req) => req.user.memberId),
  upload.single('receipt'),
  handleCreateLoanRepaymentRequest
);

router.get(
  '/',
  authenticate,
  handleGetLoanRepaymentRequests
);

// Staff endpoints (approve/reject)
const moneyRoles = ['ADMIN', 'TELLER', 'MANAGER'];

router.post(
  '/:requestId/approve',
  authenticate,
  requireRoles(...moneyRoles),
  handleApproveLoanRepaymentRequest
);

router.post(
  '/:requestId/reject',
  authenticate,
  requireRoles(...moneyRoles),
  handleRejectLoanRepaymentRequest
);

export default router;


