const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  toggleUserStatus,
  updateUserRole,
  deleteUser,
  getAllDecisions,
  deleteDecision,
  getStats,
  getRecentActivity,
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { validate } = require('../middleware/validate');
const { userIdParam, idParam } = require('../validators/common');
const { getUsersQuery, updateUserRoleValidation, getDecisionsQuery } = require('../validators/admin');

// All routes require authentication + admin role
router.use(authenticate, adminOnly);

// User management
router.get('/users', getUsersQuery, validate, getAllUsers);
router.get('/users/:userId', userIdParam, validate, getUserById);
router.put('/users/:userId/toggle', userIdParam, validate, toggleUserStatus);
router.put('/users/:userId/role', userIdParam, updateUserRoleValidation, validate, updateUserRole);
router.delete('/users/:userId', userIdParam, validate, deleteUser);

// Decision management
router.get('/decisions', getDecisionsQuery, validate, getAllDecisions);
router.delete('/decisions/:id', idParam, validate, deleteDecision);

// Statistics & activity
router.get('/stats', getStats);
router.get('/activity', getRecentActivity);

module.exports = router;
