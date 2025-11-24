import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { handleSummary, handleTransactionReport } from './report.controller.js';

const router = Router();

router.get('/summary', authenticate, requireRoles('ADMIN', 'MANAGER', 'AUDITOR', 'CREDIT_OFFICER', 'TELLER'), handleSummary);
router.get('/transactions', authenticate, requireRoles('ADMIN', 'MANAGER', 'AUDITOR'), handleTransactionReport);

export default router;

