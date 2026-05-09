const jwt = require('jsonwebtoken');
const config = require('../config');
const { supabaseAdmin } = require('../config/supabase');
const { error } = require('../utils/response');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.secret);

    // Fetch user from database
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, is_active, preferences')
      .eq('id', decoded.userId)
      .single();

    if (dbError || !user) {
      return error(res, 'Invalid token. User not found.', 401);
    }

    if (!user.is_active) {
      return error(res, 'Account has been deactivated.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token expired. Please login again.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 'Invalid token.', 401);
    }
    return error(res, 'Authentication failed.', 500);
  }
};

module.exports = { authenticate };
