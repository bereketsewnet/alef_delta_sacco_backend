import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth.js';
import {
  handleGetProfile,
  handleGetAccounts,
  handleGetAccountTransactions,
  handleGetLoans,
  handleGetLoanSchedule
} from './client.controller.js';

const router = Router();

// All client endpoints require member authentication
const requireMember = (req, res, next) => {
  if (req.user.subjectType !== 'MEMBER') {
    return res.status(403).json({ message: 'Member access only' });
  }
  next();
};

// Client profile and dashboard
router.get('/me', authenticate, requireMember, handleGetProfile);

// Client accounts
router.get('/accounts', authenticate, requireMember, handleGetAccounts);
router.get('/accounts/:accountId/transactions', authenticate, requireMember, handleGetAccountTransactions);

// Client loans
router.get('/loans', authenticate, requireMember, handleGetLoans);
router.get('/loans/:loanId/schedule', authenticate, requireMember, handleGetLoanSchedule);

export default router;

