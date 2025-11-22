import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { idempotencyMiddleware } from '../../core/middleware/idempotency.js';
import { upload, attachUploadContext } from '../../core/middleware/upload.js';
import { handleDeposit, handleWithdraw, handleGetTransactions } from './transaction.controller.js';

const router = Router();

const moneyRoles = ['ADMIN', 'TELLER', 'MANAGER', 'CREDIT_OFFICER'];

router.post(
  '/deposit',
  authenticate,
  requireRoles(...moneyRoles),
  attachUploadContext('transactions', (req) => req.body.account_id || 'general'),
  upload.single('receipt'),
  idempotencyMiddleware('transactions:deposit'),
  handleDeposit
);

router.post(
  '/withdraw',
  authenticate,
  requireRoles(...moneyRoles),
  attachUploadContext('transactions', (req) => req.body.account_id || 'general'),
  upload.single('receipt'),
  idempotencyMiddleware('transactions:withdraw'),
  handleWithdraw
);

router.get('/', authenticate, requireRoles(...moneyRoles, 'AUDITOR'), handleGetTransactions);

export default router;

