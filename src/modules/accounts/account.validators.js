import Joi from 'joi';

export const createAccountSchema = Joi.object({
  member_id: Joi.string().required(),
  product_code: Joi.string().required(),
  currency: Joi.string().default('ETB')
});

export const updateAccountSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'FROZEN', 'CLOSED'),
  lien_amount: Joi.number().min(0)
}).min(1);

