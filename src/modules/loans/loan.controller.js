import httpError from '../../core/utils/httpError.js';
import {
  createLoan,
  checkLoanEligibility,
  approveLoan,
  buildSchedule,
  getLoanOrFail,
  calculateInstallment,
  addLoanGuarantor,
  addLoanCollateral
} from './loan.service.js';
import {
  createLoanSchema,
  approveLoanSchema,
  installmentSchema,
  guarantorSchema,
  collateralSchema
} from './loan.validators.js';

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleCreateLoan(req, res, next) {
  try {
    const payload = validate(createLoanSchema, req.body);
    const loan = await createLoan(payload);
    res.status(201).json(loan);
  } catch (error) {
    next(error);
  }
}

export async function handleCheckEligibility(req, res, next) {
  try {
    const result = await checkLoanEligibility(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleApproveLoan(req, res, next) {
  try {
    const payload = validate(approveLoanSchema, req.body);
    const loan = await approveLoan(req.params.id, payload, req.user);
    res.json(loan);
  } catch (error) {
    next(error);
  }
}

export async function handleGetSchedule(req, res, next) {
  try {
    const loan = await getLoanOrFail(req.params.id);
    const schedule = buildSchedule({ loan, startDate: loan.disbursement_date || new Date() });
    res.json({ schedule });
  } catch (error) {
    next(error);
  }
}

export async function handleCalculateInstallment(req, res, next) {
  try {
    const payload = validate(installmentSchema, req.body);
    const result = calculateInstallment(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleAddGuarantor(req, res, next) {
  try {
    const payload = validate(guarantorSchema, req.body);
    const result = await addLoanGuarantor(req.params.id, payload, req.files || {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleAddCollateral(req, res, next) {
  try {
    const payload = validate(collateralSchema, req.body);
    const result = await addLoanCollateral(req.params.id, payload, req.files || {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

