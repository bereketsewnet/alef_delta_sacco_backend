import httpError from '../../core/utils/httpError.js';
import { getAccountById, getAccountsForMember } from './account.service.js';

export async function handleGetAccount(req, res, next) {
  try {
    const account = await getAccountById(req.params.id);
    res.json(account);
  } catch (error) {
    next(error);
  }
}

export async function handleGetMemberAccounts(req, res, next) {
  try {
    if (!req.params.memberId) {
      throw httpError(400, 'memberId is required');
    }
    const accounts = await getAccountsForMember(req.params.memberId);
    res.json({ data: accounts });
  } catch (error) {
    next(error);
  }
}

