import express from 'express';
import * as systemController from './system.controller.js';
import { authenticate as requireAuth } from '../../core/middleware/auth.js';
import { requireRoles as requireRole } from '../../core/middleware/roles.js';

const router = express.Router();

router.get('/eod/status', requireAuth, requireRole('ADMIN'), systemController.getLastEodStatus);
router.post('/eod/run', requireAuth, requireRole('ADMIN'), systemController.runEndOfDay);
router.get('/eod/preview', requireAuth, requireRole('ADMIN'), systemController.getEodPreview);

export default router;

