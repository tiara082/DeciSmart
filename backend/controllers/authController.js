const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { supabaseAdmin } = require('../config/supabase');
const { success, error } = require('../utils/response');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return error(res, 'Email already registered', 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const { data: newUser, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash,
        full_name,
        role: 'user',
        preferences: {},
        is_active: true,
      })
      .select('id, email, full_name, role, created_at')
      .single();

    if (dbError) {
      throw dbError;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return success(res, {
      user: newUser,
      token,
    }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, full_name, role, is_active, preferences')
      .eq('email', email)
      .single();

    if (dbError || !user) {
      return error(res, 'Invalid email or password', 401);
    }

    if (!user.is_active) {
      return error(res, 'Account has been deactivated', 403);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return error(res, 'Invalid email or password', 401);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Remove password_hash from response
    const { password_hash, ...userData } = user;

    return success(res, {
      user: userData,
      token,
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/profile
const getProfile = async (req, res, next) => {
  try {
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, preferences, is_active, created_at, updated_at')
      .eq('id', req.user.id)
      .single();

    if (dbError) {
      throw dbError;
    }

    return success(res, user, 'Profile retrieved');
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.full_name) updates.full_name = req.body.full_name;
    if (req.body.preferences) updates.preferences = req.body.preferences;

    if (Object.keys(updates).length === 0) {
      return error(res, 'No fields to update', 400);
    }

    const { data: updatedUser, error: dbError } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, email, full_name, role, preferences, updated_at')
      .single();

    if (dbError) {
      throw dbError;
    }

    return success(res, updatedUser, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
};
