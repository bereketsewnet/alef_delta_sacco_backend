import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { handleVerifyGuarantor, handleGetGuarantorSummary } from './guarantor.controller.js';

const router = Router();

// Credit Officer can verify guarantors
router.post('/:id/verify', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'), handleVerifyGuarantor);

// Get guarantor summary for a loan
router.get('/loan/:loanId/summary', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'), handleGetGuarantorSummary);

export default router;

