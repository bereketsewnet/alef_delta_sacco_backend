import Joi from 'joi';

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).required()
});

export const createUserSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('ADMIN', 'TELLER', 'CREDIT_OFFICER', 'MANAGER', 'AUDITOR').required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  status: Joi.string().valid('ACTIVE', 'DISABLED').default('ACTIVE')
});

