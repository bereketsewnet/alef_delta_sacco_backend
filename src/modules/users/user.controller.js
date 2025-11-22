import httpError from '../../core/utils/httpError.js';
import { changePasswordForUser } from './user.service.js';
import { changePasswordSchema } from './user.validators.js';

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

