import httpError from '../../core/utils/httpError.js';
import { findUserById, updateUserPassword } from './user.repository.js';
import { comparePassword, hashPassword } from '../../core/utils/password.js';

export async function changePasswordForUser(userId, currentPassword, newPassword, actor) {
  if (!userId) {
    throw httpError(400, 'User id is required');
  }
  if (actor.userId !== userId && !actor.isAdmin) {
    throw httpError(403, 'You can only change your own password');
  }
  const user = await findUserById(userId);
  if (!user) {
    throw httpError(404, 'User not found');
  }
  const match = await comparePassword(currentPassword, user.password_hash);
  if (!match) {
    throw httpError(400, 'Current password invalid');
  }
  const hash = await hashPassword(newPassword);
  await updateUserPassword(userId, hash);
  return { success: true };
}

