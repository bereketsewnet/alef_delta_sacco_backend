import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { requireRoles } from '../../core/middleware/roles.js';
import { handleSendNotification } from './notification.controller.js';

const router = Router();

router.post(
  '/send-notification',
  authenticate,
  requireRoles('ADMIN', 'MANAGER'),
  handleSendNotification
);

export default router;

