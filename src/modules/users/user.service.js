import httpError from '../../core/utils/httpError.js';
import { findUserById, updateUserPassword, createUser, findUserByUsername, findUserByEmail, listUsers } from './user.repository.js';
import { comparePassword, hashPassword } from '../../core/utils/password.js';
import { v4 as uuid } from 'uuid';

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

export async function createNewUser(payload) {
  const { username, password, role, email, phone, status = 'ACTIVE' } = payload;
  
  // Check if username already exists
  const existingUserByUsername = await findUserByUsername(username);
  if (existingUserByUsername) {
    throw httpError(409, 'Username already exists');
  }
  
  // Check if email already exists
  const existingUserByEmail = await findUserByEmail(email);
  if (existingUserByEmail) {
    throw httpError(409, 'Email already exists');
  }
  
  // Hash password
  const passwordHash = await hashPassword(password);
  
  // Create user
  const user_id = uuid();
  const user = await createUser({
    user_id,
    username,
    password_hash: passwordHash,
    role,
    email,
    phone,
    status
  });
  
  // Return safe user object (without password_hash)
  return {
    user_id: user.user_id,
    username: user.username,
    role: user.role,
    email: user.email,
    phone: user.phone,
    status: user.status
  };
}

export async function getUsers(filters = {}) {
  const users = await listUsers(filters);
  return users;
}

