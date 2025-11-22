import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { handleGetAccount, handleGetMemberAccounts } from './account.controller.js';

const router = Router();

router.get('/:id', authenticate, requireRoles('ADMIN', 'TELLER', 'MANAGER', 'AUDITOR'), handleGetAccount);
router.get(
  '/member/:memberId',
  authenticate,
  requireRoles('ADMIN', 'TELLER', 'MANAGER', 'AUDITOR'),
  handleGetMemberAccounts
);

export default router;

