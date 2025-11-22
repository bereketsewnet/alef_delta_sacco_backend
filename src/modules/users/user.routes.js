import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import { handleChangePassword } from './user.controller.js';

const router = Router();

router.post('/:id/change-password', authenticate, handleChangePassword);

export default router;

