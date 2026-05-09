const { error } = require('../utils/response');

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return error(res, 'Authentication required.', 401);
  }

  if (req.user.role !== 'admin') {
    return error(res, 'Access denied. Admin only.', 403);
  }

  next();
};

module.exports = { adminOnly };
