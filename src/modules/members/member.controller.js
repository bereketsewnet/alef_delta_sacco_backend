import httpError from '../../core/utils/httpError.js';
import {
  createMemberSchema,
  updateMemberSchema,
  beneficiarySchema
} from './member.validators.js';
import {
  getMembers,
  getMemberById,
  createNewMember,
  updateExistingMember,
  saveMemberUploads,
  addMemberBeneficiary
} from './member.service.js';

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw httpError(400, 'Validation failed', error.details);
  }
  return value;
}

export async function handleListMembers(req, res, next) {
  try {
    const rows = await getMembers({
      search: req.query.search,
      status: req.query.status,
      limit: req.query.limit,
      offset: req.query.offset
    });
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
}

export async function handleGetMember(req, res, next) {
  try {
    const member = await getMemberById(req.params.id);
    res.json(member);
  } catch (error) {
    next(error);
  }
}

export async function handleCreateMember(req, res, next) {
  try {
    const payload = validate(createMemberSchema, req.body);
    const member = await createNewMember(payload);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateMember(req, res, next) {
  try {
    const payload = validate(updateMemberSchema, req.body);
    const member = await updateExistingMember(req.params.id, payload);
    res.json(member);
  } catch (error) {
    next(error);
  }
}

export async function handleUpload(req, res, next) {
  try {
    const member = await saveMemberUploads(req.params.id, req.files || {});
    res.json(member);
  } catch (error) {
    next(error);
  }
}

export async function handleAddBeneficiary(req, res, next) {
  try {
    const payload = validate(beneficiarySchema, req.body);
    const beneficiaries = await addMemberBeneficiary(req.params.id, payload, req.files || {});
    res.status(201).json({ data: beneficiaries });
  } catch (error) {
    next(error);
  }
}

