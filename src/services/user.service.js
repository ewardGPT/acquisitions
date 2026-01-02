import { db } from '../config/database.js';
import { users } from '../models/user.model.js';
import logger from '#config/logger.js';
import { eq } from 'drizzle-orm';

const baseUserSelection = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  created_at: users.created_at,
  updated_at: users.updated_at,
};

export const getAllUsers = async () => {
  try {
    return await db.select(baseUserSelection).from(users);
  } catch (e) {
    logger.error(`Error getting users: ${e}`);
    throw e;
  }
};

export const getUserById = async id => {
  try {
    const [user] = await db
      .select(baseUserSelection)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (e) {
    logger.error(`Error getting user with id ${id}: ${e}`);
    throw e;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (existing.length === 0) {
      throw new Error('User not found');
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning(baseUserSelection);

    logger.info(`User with id ${id} updated successfully`);
    return updatedUser;
  } catch (e) {
    logger.error(`Error updating user with id ${id}: ${e}`);
    throw e;
  }
};

export const deleteUser = async id => {
  try {
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning(baseUserSelection);

    if (!deletedUser) {
      throw new Error('User not found');
    }

    logger.info(`User with id ${id} deleted successfully`);
    return deletedUser;
  } catch (e) {
    logger.error(`Error deleting user with id ${id}: ${e}`);
    throw e;
  }
};
