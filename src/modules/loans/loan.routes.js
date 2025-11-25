import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { upload, attachUploadContext } from '../../core/middleware/upload.js';
import {
  handleListLoans,
  handleGetLoan,
  handleCreateLoan,
  handleCheckEligibility,
  handleApproveLoan,
  handleGetSchedule,
  handleCalculateInstallment,
  handleAddGuarantor,
  handleAddCollateral,
  handleUpdateLoanStatus
} from './loan.controller.js';

const router = Router();

// List loans (must be before /:id routes)
router.get('/', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER', 'TELLER'), handleListLoans);
// Get single loan
router.get('/:id', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER', 'TELLER'), handleGetLoan);
// Create loan
router.post('/', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'), handleCreateLoan);
router.post(
  '/:id/check-eligibility',
  authenticate,
  requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'),
  handleCheckEligibility
);
router.post(
  '/:id/approve',
  authenticate,
  requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'),
  handleApproveLoan
);
router.put(
  '/:id/status',
  authenticate,
  requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'),
  handleUpdateLoanStatus
);
router.get('/:id/schedule', authenticate, requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'), handleGetSchedule);
router.post('/calculate-installment', authenticate, handleCalculateInstallment);
router.post(
  '/:id/guarantors',
  authenticate,
  requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'),
  attachUploadContext('guarantors', (req) => req.params.id),
  upload.fields([
    { name: 'id_front', maxCount: 1 },
    { name: 'id_back', maxCount: 1 },
    { name: 'profile_photo', maxCount: 1 }
  ]),
  handleAddGuarantor
);
router.post(
  '/:id/collateral',
  authenticate,
  requireRoles('ADMIN', 'CREDIT_OFFICER', 'MANAGER'),
  attachUploadContext('collateral', (req) => req.params.id),
  upload.fields([{ name: 'document', maxCount: 1 }]),
  handleAddCollateral
);

export default router;

