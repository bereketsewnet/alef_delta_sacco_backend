import Joi from 'joi';

export const createAccountSchema = Joi.object({
  member_id: Joi.string().required(),
  product_code: Joi.string().required(),
  currency: Joi.string().default('ETB')
});

export const updateAccountSchema = Joi.object({
  product_code: Joi.string().valid('SAV_COMPULSORY', 'SAV_VOLUNTARY', 'SAV_FIXED', 'SHR_CAP'),
  currency: Joi.string().valid('ETB', 'USD'),
  status: Joi.string().valid('ACTIVE', 'FROZEN', 'CLOSED'),
  lien_amount: Joi.number().min(0)
}).min(1);

