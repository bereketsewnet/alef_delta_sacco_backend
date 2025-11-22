import httpError from '../../core/utils/httpError.js';
import { forwardToBot } from './notification.service.js';

export async function handleSendNotification(req, res, next) {
  try {
    if (!req.body.chat_id || !req.body.message) {
      throw httpError(400, 'chat_id and message are required');
    }
    const result = await forwardToBot(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

