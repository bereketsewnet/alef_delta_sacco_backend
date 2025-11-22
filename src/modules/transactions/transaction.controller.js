import httpError from '../../core/utils/httpError.js';
import { toPublicUrl } from '../../core/utils/fileStorage.js';
import { deposit, withdraw, getTransactions } from './transaction.service.js';
import { moneyMovementSchema, transactionQuerySchema } from './transaction.validators.js';

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleDeposit(req, res, next) {
  try {
    const payload = validate(moneyMovementSchema, req.body);
    const receiptPhotoUrl = req.file ? toPublicUrl(req.file.path) : null;
    const txn = await deposit({
      accountId: payload.account_id,
      amount: payload.amount,
      reference: payload.reference,
      receiptPhotoUrl,
      performedBy: req.user?.userId || 'SYSTEM',
      idempotencyKey: req.idempotency?.key
    });
    const response = { idempotency_key: req.idempotency?.key, transaction: txn };
    if (req.idempotency) {
      await req.idempotency.save(201, response);
    }
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function handleWithdraw(req, res, next) {
  try {
    const payload = validate(moneyMovementSchema, req.body);
    const receiptPhotoUrl = req.file ? toPublicUrl(req.file.path) : null;
    const txn = await withdraw({
      accountId: payload.account_id,
      amount: payload.amount,
      reference: payload.reference,
      receiptPhotoUrl,
      performedBy: req.user?.userId || 'SYSTEM',
      idempotencyKey: req.idempotency?.key
    });
    const response = { idempotency_key: req.idempotency?.key, transaction: txn };
    if (req.idempotency) {
      await req.idempotency.save(201, response);
    }
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function handleGetTransactions(req, res, next) {
  try {
    const payload = validate(transactionQuerySchema, req.query);
    const rows = await getTransactions(payload);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
}

