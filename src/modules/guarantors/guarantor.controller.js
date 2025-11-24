import { verifyGuarantor, getGuarantorSummary } from './guarantor.service.js';

export async function handleVerifyGuarantor(req, res, next) {
  try {
    const guarantor = await verifyGuarantor(req.params.id, req.user, req.body);
    res.json(guarantor);
  } catch (error) {
    next(error);
  }
}

export async function handleGetGuarantorSummary(req, res, next) {
  try {
    const summary = await getGuarantorSummary(req.params.loanId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

