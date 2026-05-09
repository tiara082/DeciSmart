// Pagination helper

const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const getSupabaseRange = (page, limit) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { from, to };
};

module.exports = { getPagination, getSupabaseRange };
