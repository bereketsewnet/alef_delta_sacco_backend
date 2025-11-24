import { getOperationalSummary, getTransactionStats } from './report.service.js';

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

