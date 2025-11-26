import * as systemService from './system.service.js';
import * as reportService from '../reports/report.service.js';

export async function getLastEodStatus(req, res, next) {
  try {
    const status = await systemService.getLastJobStatus('EOD');
    res.json(status || { status: 'NEVER_RUN' });
  } catch (error) {
    next(error);
  }
}

export async function runEndOfDay(req, res, next) {
  try {
    const userId = req.user.id;
    const jobId = await systemService.startJob('EOD', userId);
    
    // Run async to not block response, or await if client waits
    // For now, we await to verify completion in this demo
    await systemService.processEndOfDay(jobId);
    
    res.json({ message: 'EOD process completed successfully', jobId });
  } catch (error) {
    next(error);
  }
}

export async function getEodPreview(req, res, next) {
  try {
    const { type } = req.query;
    let stats;

    if (type === 'monthly') {
      stats = await systemService.getMonthlyEodStats();
    } else {
      // Default to daily
      stats = await systemService.getDailyEodStats();
    }
    
    res.json(stats);
  } catch (error) {
    next(error);
  }
}
