import { getOperationalSummary } from './report.service.js';

export async function handleSummary(req, res, next) {
  try {
    const summary = await getOperationalSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

