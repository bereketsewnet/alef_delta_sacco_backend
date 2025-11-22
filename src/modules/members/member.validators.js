import Joi from 'joi';

export const createMemberSchema = Joi.object({
  first_name: Joi.string().required(),
  middle_name: Joi.string().allow(null, ''),
  last_name: Joi.string().required(),
  phone_primary: Joi.string().required(),
  email: Joi.string().email().allow(null, ''),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required(),
  marital_status: Joi.string().valid('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED').required(),
  address_subcity: Joi.string().allow(null, ''),
  address_woreda: Joi.string().allow(null, ''),
  address_house_no: Joi.string().allow(null, ''),
  member_type: Joi.string().valid('INDIVIDUAL', 'GOV_EMP', 'NGO', 'SME').required(),
  monthly_income: Joi.number().min(0).required(),
  tin_number: Joi.string().allow(null, ''),
  status: Joi.string().valid('ACTIVE', 'SUSPENDED').default('ACTIVE'),
  password: Joi.string().min(8).required()
});

export const updateMemberSchema = createMemberSchema.fork(
  Object.keys(createMemberSchema.describe().keys),
  (schema) => schema.optional()
).keys({
  password: Joi.forbidden()
});

export const beneficiarySchema = Joi.object({
  full_name: Joi.string().required(),
  relationship: Joi.string().required(),
  phone: Joi.string().required()
});

