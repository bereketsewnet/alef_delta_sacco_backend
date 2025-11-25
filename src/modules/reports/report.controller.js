import { getOperationalSummary, getTransactionStats, getTellerDashboardStats, getCreditOfficerDashboardStats } from './report.service.js';

export async function handleSummary(req, res, next) {
  try {
    const summary = await getOperationalSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

export async function handleTransactionReport(req, res, next) {
  try {
    const { start_date, end_date } = req.query;
    const stats = await getTransactionStats(start_date, end_date);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function handleTellerDashboard(req, res, next) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User ID required' });
    }
    const stats = await getTellerDashboardStats(req.user.userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function handleCreditOfficerDashboard(req, res, next) {
  try {
    const stats = await getCreditOfficerDashboardStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

