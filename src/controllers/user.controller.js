import {
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '../services/user.service.js';
import logger from '#config/logger.js';
import {
  userIdSchema,
  updateUserSchema,
} from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users ...');

    const allUsers = await getAllUsers();
    res.json({
      message: 'Successfully retrieved users',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    logger.error('Error fetching all users', e);
    next(e);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Getting user by id: ${id}`);
    const user = await getUserByIdService(id);

    res.status(200).json({
      message: 'Successfully retrieved user',
      user,
    });
  } catch (e) {
    logger.error('Error fetching user by id', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const idValidation = userIdSchema.safeParse(req.params);
    if (!idValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idValidation.error),
      });
    }

    const bodyValidation = updateUserSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = idValidation.data;
    const updates = bodyValidation.data;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isAdmin = req.user.role === 'admin';
    const isSelf = Number(req.user.id) === Number(id);

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own account',
      });
    }

    if (updates.role && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can change user roles',
      });
    }

    logger.info(`Updating user with id: ${id}`);
    const updatedUser = await updateUserService(id, updates);

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (e) {
    logger.error('Error updating user', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isAdmin = req.user.role === 'admin';
    const isSelf = Number(req.user.id) === Number(id);

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own account',
      });
    }

    logger.info(`Deleting user with id: ${id}`);
    const deletedUser = await deleteUserService(id);

    res.status(200).json({
      message: 'User deleted successfully',
      user: deletedUser,
    });
  } catch (e) {
    logger.error('Error deleting user', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};
