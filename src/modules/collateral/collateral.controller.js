import { verifyCollateral, getCollateralSummary } from './collateral.service.js';

export async function handleVerifyCollateral(req, res, next) {
  try {
    const collateral = await verifyCollateral(req.params.id, req.user, req.body);
    res.json(collateral);
  } catch (error) {
    next(error);
  }
}

export async function handleGetCollateralSummary(req, res, next) {
  try {
    const summary = await getCollateralSummary(req.params.loanId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

