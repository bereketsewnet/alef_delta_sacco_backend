import { query, execute } from '../../core/db.js';

export async function findUserByUsername(username) {
  const rows = await query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
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

