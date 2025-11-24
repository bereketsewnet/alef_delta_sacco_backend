import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { handleCreateUser, handleListUsers, handleChangePassword } from './user.controller.js';
import { requireRoles } from '../../core/middleware/roles.js';

const router = Router();

// List users (Admin only)
router.get('/', authenticate, requireRoles('ADMIN'), handleListUsers);

// Create user (Admin only)
router.post('/', authenticate, requireRoles('ADMIN'), handleCreateUser);

// Change password
router.post('/:id/change-password', authenticate, handleChangePassword);

export default router;

