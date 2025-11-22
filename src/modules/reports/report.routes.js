import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { handleSummary } from './report.controller.js';

const router = Router();

router.get('/summary', authenticate, requireRoles('ADMIN', 'MANAGER', 'AUDITOR'), handleSummary);

export default router;

