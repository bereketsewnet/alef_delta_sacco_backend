import Joi from 'joi';

export const createAccountProductSchema = Joi.object({
  product_code: Joi.string().required().max(30),
  name: Joi.string().required().max(150),
  description: Joi.string().allow(null, ''),
  category: Joi.string().max(50).allow(null, ''),
  is_active: Joi.boolean().default(true),
  min_balance: Joi.number().min(0).default(0),
  interest_rate: Joi.number().min(0).max(100).default(0)
});

export const updateAccountProductSchema = Joi.object({
  name: Joi.string().max(150),
  description: Joi.string().allow(null, ''),
  category: Joi.string().max(50).allow(null, ''),
  is_active: Joi.boolean(),
  min_balance: Joi.number().min(0),
  interest_rate: Joi.number().min(0).max(100)
}).min(1);

