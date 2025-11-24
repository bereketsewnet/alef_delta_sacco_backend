import { query, execute } from '../../core/db.js';

export async function findUserByUsername(username) {
  // Trim whitespace and use case-insensitive lookup
  if (!username) return null;
  const normalizedUsername = username.trim();
  // Use BINARY for case-sensitive if needed, but LOWER for case-insensitive
  const rows = await query(
    'SELECT * FROM users WHERE LOWER(TRIM(username)) = LOWER(?)',
    [normalizedUsername]
  );
  return rows[0];
}

export async function findUserByEmail(email) {
  // Trim whitespace and use case-insensitive lookup for email
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();
  const rows = await query(
    'SELECT * FROM users WHERE LOWER(TRIM(email)) = ?',
    [normalizedEmail]
  );
  return rows[0];
}

export async function findUserByIdentifier(identifier) {
  // Find user by username or email (case-insensitive)
  if (!identifier) return null;
  const normalized = identifier.trim();
  
  // Check if it looks like an email (contains @)
  if (normalized.includes('@')) {
    return await findUserByEmail(normalized);
  } else {
    return await findUserByUsername(normalized);
  }
}

export async function findUserById(userId) {
  const rows = await query('SELECT * FROM users WHERE user_id = ?', [userId]);
  return rows[0];
}

export async function updateUserPassword(userId, passwordHash) {
  await execute(
    'UPDATE users SET password_hash = ?, password_changed_at = NOW() WHERE user_id = ?',
    [passwordHash, userId]
  );
}

export async function resetUserPassword(userId, passwordHash) {
  await execute(
    'UPDATE users SET password_hash = ?, password_changed_at = NOW(), force_password_reset = 1 WHERE user_id = ?',
    [passwordHash, userId]
  );
}

export async function createUser(user) {
  const { user_id, username, password_hash, role, email, phone, status = 'ACTIVE' } = user;
  await execute(
    `INSERT INTO users (user_id, username, password_hash, role, email, phone, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user_id, username, password_hash, role, email, phone, status]
  );
  return findUserById(user_id);
}

export async function listUsers(filters = {}) {
  let sql = 'SELECT user_id, username, role, email, phone, status, created_at FROM users WHERE 1=1';
  const params = [];
  
  if (filters.role) {
    sql += ' AND role = ?';
    params.push(filters.role);
  }
  
  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  if (filters.limit) {
    sql += ' LIMIT ?';
    params.push(filters.limit);
  }
  
  return await query(sql, params);
}

