import { query, execute } from '../../core/db.js';

export async function findMemberByPhone(phone) {
  const rows = await query('SELECT * FROM members WHERE phone_primary = ?', [phone]);
  return rows[0];
}

export async function findMemberById(memberId) {
  const rows = await query('SELECT * FROM members WHERE member_id = ?', [memberId]);
  return rows[0];
}

export async function listMembers({ search, status, limit = 25, offset = 0 }) {
  const where = [];
  const params = [];
  if (search) {
    where.push('(first_name LIKE ? OR last_name LIKE ? OR membership_no LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await query(
    `SELECT * FROM members ${whereClause} ORDER BY registered_date DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return rows;
}

export async function createMember(member) {
  await execute(
    `INSERT INTO members
    (member_id, membership_no, first_name, middle_name, last_name, phone_primary, email, gender,
     marital_status, address_subcity, address_woreda, address_house_no, member_type, monthly_income,
     tin_number, status, profile_photo_url, id_card_url, password_hash, registered_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      member.member_id,
      member.membership_no,
      member.first_name,
      member.middle_name,
      member.last_name,
      member.phone_primary,
      member.email,
      member.gender,
      member.marital_status,
      member.address_subcity,
      member.address_woreda,
      member.address_house_no,
      member.member_type,
      member.monthly_income,
      member.tin_number,
      member.status,
      member.profile_photo_url,
      member.id_card_url,
      member.password_hash
    ]
  );
}

export async function updateMember(memberId, updates) {
  const fields = [];
  const params = [];
  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    params.push(value);
  });
  if (!fields.length) return;
  params.push(memberId);
  await execute(`UPDATE members SET ${fields.join(', ')}, updated_at = NOW() WHERE member_id = ?`, params);
}

export async function updateMemberPassword(memberId, passwordHash) {
  await execute(
    'UPDATE members SET password_hash = ?, password_changed_at = NOW() WHERE member_id = ?',
    [passwordHash, memberId]
  );
}

