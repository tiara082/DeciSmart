/**
 * Date helper utilities
 */

/**
 * Format date to ISO string without milliseconds
 */
const formatDate = (date = new Date()) => {
  return date.toISOString().split('.')[0] + 'Z';
};

/**
 * Get relative time string (e.g., "2 hours ago")
 */
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
};

/**
 * Get start and end of a date range
 */
const getDateRange = (range) => {
  const now = new Date();
  const start = new Date();

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return {
    from: start.toISOString(),
    to: now.toISOString(),
  };
};

/**
 * Check if date is within range
 */
const isWithinRange = (date, from, to) => {
  const d = new Date(date);
  return d >= new Date(from) && d <= new Date(to);
};

module.exports = {
  formatDate,
  timeAgo,
  getDateRange,
  isWithinRange,
};
