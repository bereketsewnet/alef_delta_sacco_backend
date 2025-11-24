import httpError from '../../core/utils/httpError.js';
import { changePasswordForUser, createNewUser, getUsers } from './user.service.js';
import { changePasswordSchema, createUserSchema } from './user.validators.js';

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleCreateUser(req, res, next) {
  try {
    // Only admins can create users
    if (!req.user.isAdmin) {
      throw httpError(403, 'Only admins can create users');
    }
    const payload = validate(createUserSchema, req.body);
    const result = await createNewUser(payload);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleListUsers(req, res, next) {
  try {
    const filters = {
      role: req.query.role,
      status: req.query.status,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };
    const users = await getUsers(filters);
    res.json({ data: users, total: users.length });
  } catch (err) {
    next(err);
  }
}

export async function handleChangePassword(req, res, next) {
  try {
    const { value, error } = changePasswordSchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw httpError(400, 'Validation failed', error.details);
    }
    const result = await changePasswordForUser(
      req.params.id,
      value.current_password,
      value.new_password,
      req.user
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

