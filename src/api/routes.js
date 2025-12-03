import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import memberRoutes from '../modules/members/member.routes.js';
import accountRoutes from '../modules/accounts/account.routes.js';
import transactionRoutes from '../modules/transactions/transaction.routes.js';
import loanRoutes from '../modules/loans/loan.routes.js';
import loanRepaymentRoutes from '../modules/loan-repayments/repayment.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';
import reportRoutes from '../modules/reports/report.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import collateralRoutes from '../modules/collateral/collateral.routes.js';
import guarantorRoutes from '../modules/guarantors/guarantor.routes.js';
import beneficiaryRoutes from '../modules/beneficiaries/beneficiary.routes.js';
import loanProductRoutes from '../modules/loan-products/loan-product.routes.js';
import accountProductRoutes from '../modules/account-products/account-product.routes.js';
import systemRoutes from '../modules/system/system.routes.js';
import clientRoutes from '../modules/client/client.routes.js';
import { healthCheck } from '../core/db.js';

const router = Router();

router.get('/health', async (req, res) => {
  const healthy = await healthCheck();
  res.json({ status: healthy ? 'ok' : 'degraded' });
});

// Internal staff endpoints
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/members', memberRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/loans', loanRoutes);
router.use('/loan-products', loanProductRoutes);
router.use('/account-products', accountProductRoutes);
router.use('/collateral', collateralRoutes);
router.use('/guarantors', guarantorRoutes);
router.use('/beneficiaries', beneficiaryRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/system', systemRoutes);
router.use('/', loanRepaymentRoutes); // Loan repayments (mounted at root for /loans/:id/repayments paths)

// Client-facing endpoints (Telegram Mini App)
router.use('/client', clientRoutes);

export default router;

