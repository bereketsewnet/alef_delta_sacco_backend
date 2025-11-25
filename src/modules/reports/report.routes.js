import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { handleSummary, handleTransactionReport, handleTellerDashboard, handleCreditOfficerDashboard } from './report.controller.js';

const router = Router();

router.get('/summary', authenticate, requireRoles('ADMIN', 'MANAGER', 'AUDITOR', 'CREDIT_OFFICER', 'TELLER'), handleSummary);
router.get('/transactions', authenticate, requireRoles('ADMIN', 'MANAGER', 'AUDITOR'), handleTransactionReport);
router.get('/teller-dashboard', authenticate, requireRoles('TELLER', 'ADMIN', 'MANAGER'), handleTellerDashboard);
router.get('/credit-officer-dashboard', authenticate, requireRoles('CREDIT_OFFICER', 'ADMIN', 'MANAGER'), handleCreditOfficerDashboard);

export default router;

