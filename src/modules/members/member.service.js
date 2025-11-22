import { v4 as uuid } from 'uuid';
import httpError from '../../core/utils/httpError.js';
import { hashPassword } from '../../core/utils/password.js';
import {
  listMembers,
  findMemberById,
  createMember,
  updateMember
} from './member.repository.js';
import { createBeneficiary, listBeneficiaries } from '../beneficiaries/beneficiary.repository.js';
import { toPublicUrl } from '../../core/utils/fileStorage.js';

function generateMembershipNumber() {
  return `MEM-${Date.now()}`;
}

export async function getMembers(filters) {
  return listMembers(filters);
}

export async function getMemberById(memberId) {
  const member = await findMemberById(memberId);
  if (!member) {
    throw httpError(404, 'Member not found');
  }
  const beneficiaries = await listBeneficiaries(memberId);
  return { ...member, beneficiaries };
}

export async function createNewMember(payload) {
  const memberId = uuid();
  const passwordHash = await hashPassword(payload.password);
  await createMember({
    ...payload,
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
  await updateMember(memberId, payload);
  return getMemberById(memberId);
}

export async function saveMemberUploads(memberId, files) {
  const updates = {};
  if (files.profile_photo?.[0]) {
    updates.profile_photo_url = toPublicUrl(files.profile_photo[0].path);
  }
  if (files.id_card?.[0]) {
    updates.id_card_url = toPublicUrl(files.id_card[0].path);
  }
  if (!Object.keys(updates).length) {
    throw httpError(400, 'No files processed');
  }
  await updateMember(memberId, updates);
  return getMemberById(memberId);
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

