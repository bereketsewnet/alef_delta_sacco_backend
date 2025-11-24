import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import { hashPassword } from '../../core/utils/password.js';
import {
  listMembers,
  findMemberById,
  createMember,
  updateMember,
  updateMemberPassword,
  deleteMember,
  countMembers
} from './member.repository.js';
import { createBeneficiary, listBeneficiaries } from '../beneficiaries/beneficiary.repository.js';
import { toPublicUrl } from '../../core/utils/fileStorage.js';
import { query } from '../../core/db.js';

function generateMembershipNumber() {
  return `MEM-${Date.now()}`;
}

export async function getMembers(filters) {
  const data = await listMembers(filters);
  const total = await countMembers(filters);
  return { data, total, limit: filters.limit || 25, offset: filters.offset || 0 };
}

export async function getMemberById(memberId) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  const beneficiaries = await listBeneficiaries(memberId);
  return { ...member, beneficiaries };
}

// Transform frontend values to database values
function transformMemberPayload(payload) {
  const transformed = { ...payload };
  
  // Transform gender: M -> MALE, F -> FEMALE
  if (transformed.gender === 'M') {
    transformed.gender = 'MALE';
  } else if (transformed.gender === 'F') {
    transformed.gender = 'FEMALE';
  }
  // MALE, FEMALE, OTHER are already correct
  
  // Transform member_type: TRADER/FARMER/SELF -> database values
  if (transformed.member_type === 'TRADER') {
    transformed.member_type = 'SME';
  } else if (transformed.member_type === 'FARMER' || transformed.member_type === 'SELF') {
    transformed.member_type = 'INDIVIDUAL';
  }
  // INDIVIDUAL, GOV_EMP, NGO, SME are already correct
  
  // Convert undefined to null for optional fields
  const optionalFields = ['middle_name', 'email', 'address_subcity', 'address_woreda', 'address_house_no', 'tin_number', 'profile_photo_url', 'id_card_url'];
  optionalFields.forEach(field => {
    if (transformed[field] === undefined || transformed[field] === '') {
      transformed[field] = null;
    }
  });
  
  // Ensure status has a default
  if (!transformed.status) {
    transformed.status = 'ACTIVE';
  }
  
  return transformed;
}

export async function createNewMember(payload) {
  const memberId = uuid();
  const passwordHash = await hashPassword(payload.password);
  
  // Transform frontend values to database format
  const transformedPayload = transformMemberPayload(payload);
  
  await createMember({
    ...transformedPayload,
    member_id: memberId,
    membership_no: generateMembershipNumber(),
    password_hash: passwordHash
  });
  return getMemberById(memberId);
}

export async function updateExistingMember(memberId, payload) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  
  // Handle password update separately if provided
  if (payload.password && payload.password.trim() !== '') {
    const passwordHash = await hashPassword(payload.password);
    await updateMemberPassword(memberId, passwordHash);
    // Remove password from payload to avoid including it in regular update
    delete payload.password;
  }
  
  // Transform frontend values to database format
  const transformedPayload = transformMemberPayload(payload);
  await updateMember(memberId, transformedPayload);
  return getMemberById(memberId);
}

export async function saveMemberUploads(memberId, files) {
  const updates = {};
  
  try {
    if (files.profile_photo?.[0]) {
      const filePath = files.profile_photo[0].path || files.profile_photo[0].destination + '/' + files.profile_photo[0].filename;
      updates.profile_photo_url = toPublicUrl(filePath);
    }
    if (files.id_card_front?.[0]) {
      const filePath = files.id_card_front[0].path || files.id_card_front[0].destination + '/' + files.id_card_front[0].filename;
      updates.id_card_front_url = toPublicUrl(filePath);
    }
    if (files.id_card_back?.[0]) {
      const filePath = files.id_card_back[0].path || files.id_card_back[0].destination + '/' + files.id_card_back[0].filename;
      updates.id_card_back_url = toPublicUrl(filePath);
    }
    // Support legacy id_card field for backward compatibility
    if (files.id_card?.[0]) {
      const filePath = files.id_card[0].path || files.id_card[0].destination + '/' + files.id_card[0].filename;
      updates.id_card_front_url = toPublicUrl(filePath);
    }
    
    if (!Object.keys(updates).length) {
      throw httpError(400, 'No files processed');
    }
    
    await updateMember(memberId, updates);
    return getMemberById(memberId);
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Files received:', JSON.stringify(Object.keys(files || {})));
    throw error;
  }
}

export async function addMemberBeneficiary(memberId, payload, files) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  const beneficiaryId = uuid();
  await createBeneficiary({
    beneficiary_id: beneficiaryId,
    member_id: memberId,
    full_name: payload.full_name,
    relationship: payload.relationship,
    phone: payload.phone,
    id_front_url: files?.id_front?.[0] ? toPublicUrl(files.id_front[0].path) : null,
    id_back_url: files?.id_back?.[0] ? toPublicUrl(files.id_back[0].path) : null
  });
  return listBeneficiaries(memberId);
}

export async function removeMember(memberId, actor) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  // Check if member has active loans or non-zero balances
  const accounts = await query('SELECT * FROM accounts WHERE member_id = ? AND (balance != 0 OR status = ?)', [memberId, 'ACTIVE']);
  if (accounts.length > 0) {
    throw httpError(400, 'Cannot delete member with active accounts or non-zero balances');
  }
  const activeLoans = await query('SELECT * FROM loan_applications WHERE member_id = ? AND workflow_status IN (?, ?, ?)', [memberId, 'APPROVED', 'DISBURSED', 'REVIEW']);
  if (activeLoans.length > 0) {
    throw httpError(400, 'Cannot delete member with active loans');
  }
  await deleteMember(memberId);
  return { success: true, message: 'Member deleted successfully' };
}

export async function activateMember(memberId, actor) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  if (member.status === 'ACTIVE') {
    throw httpError(400, 'Member is already active');
  }
  await updateMember(memberId, { status: 'ACTIVE' });
  return getMemberById(memberId);
}

export async function suspendMember(memberId, actor, reason) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  await updateMember(memberId, { status: 'SUSPENDED' });
  return getMemberById(memberId);
}

