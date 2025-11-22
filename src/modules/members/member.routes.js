import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { upload, attachUploadContext } from '../../core/middleware/upload.js';
import {
  handleListMembers,
  handleGetMember,
  handleCreateMember,
  handleUpdateMember,
  handleUpload,
  handleAddBeneficiary
} from './member.controller.js';

const router = Router();
const staffRoles = ['ADMIN', 'TELLER', 'MANAGER', 'CREDIT_OFFICER', 'AUDITOR'];

router.get('/', authenticate, requireRoles(...staffRoles), handleListMembers);

router.get(
  '/:id',
  authenticate,
  (req, res, next) => {
    if (req.user.subjectType === 'MEMBER' && req.user.memberId !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.subjectType === 'STAFF' && !staffRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  },
  handleGetMember
);

router.post('/', authenticate, requireRoles('ADMIN', 'MANAGER'), handleCreateMember);
router.put('/:id', authenticate, requireRoles('ADMIN', 'MANAGER'), handleUpdateMember);

router.post(
  '/:id/upload',
  authenticate,
  requireRoles(...staffRoles),
  attachUploadContext('members', (req) => req.params.id),
  upload.fields([
    { name: 'profile_photo', maxCount: 1 },
    { name: 'id_card', maxCount: 1 }
  ]),
  handleUpload
);

router.post(
  '/:id/beneficiaries',
  authenticate,
  requireRoles(...staffRoles),
  attachUploadContext('beneficiaries', (req) => req.params.id),
  upload.fields([
    { name: 'id_front', maxCount: 1 },
    { name: 'id_back', maxCount: 1 }
  ]),
  handleAddBeneficiary
);

export default router;

