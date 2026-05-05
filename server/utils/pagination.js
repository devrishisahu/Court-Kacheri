import { PAGINATION } from '../config/constants.js';

/**
 * Builds pagination + sorting metadata from query params.
 *
 * Pagination:  ?page=1&limit=10
 * Sorting:     ?sort=title,-createdAt   (prefix with - for descending)
 * Search:      handled per-controller
 */
export const paginate = (query) => {
  const page = Math.max(parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE, 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT, 1),
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  // Sort: "title,-createdAt" → "title -createdAt"
  let sort = '-createdAt'; // default
  if (query.sort) {
    sort = query.sort.split(',').join(' ');
  }

  return { page, limit, skip, sort };
};

/**
 * Builds the `meta` object for paginated responses.
 */
export const buildMeta = ({ total, page, limit }) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
});
