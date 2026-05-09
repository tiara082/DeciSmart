/**
 * Helper utilities
 */

/**
 * Remove undefined/null fields from object
 */
const cleanObject = (obj) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

/**
 * Pick specific fields from object
 */
const pick = (obj, fields) => {
  const result = {};
  for (const field of fields) {
    if (obj[field] !== undefined) {
      result[field] = obj[field];
    }
  }
  return result;
};

/**
 * Omit specific fields from object
 */
const omit = (obj, fields) => {
  const result = { ...obj };
  for (const field of fields) {
    delete result[field];
  }
  return result;
};

/**
 * Generate a random string
 */
const randomString = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Truncate string with ellipsis
 */
const truncate = (str, maxLength = 100) => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Check if value is a valid UUID
 */
const isUUID = (value) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Parse boolean from string
 */
const parseBool = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
};

/**
 * Clamp number between min and max
 */
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

/**
 * Calculate percentage
 */
const percentage = (value, total) => {
  if (total === 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(2));
};

module.exports = {
  cleanObject,
  pick,
  omit,
  randomString,
  sleep,
  truncate,
  isUUID,
  parseBool,
  clamp,
  percentage,
};
