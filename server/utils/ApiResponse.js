/**
 * Standardised API response helper.
 * Ensures every endpoint returns the same envelope:
 *   { success, message, data, meta? }
 */
class ApiResponse {
  /**
   * Send a success response.
   * @param {import('express').Response} res
   * @param {object} options
   * @param {number}  [options.statusCode=200]
   * @param {string}  options.message
   * @param {*}       [options.data]
   * @param {object}  [options.meta]  — pagination, counts, etc.
   */
  static success(res, { statusCode = 200, message = 'Success', data = null, meta = undefined }) {
    const body = { success: true, message };
    if (data !== null && data !== undefined) body.data = data;
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  /**
   * Send a created (201) response.
   */
  static created(res, { message = 'Created successfully', data = null }) {
    return ApiResponse.success(res, { statusCode: 201, message, data });
  }

  /**
   * Send a deleted response.
   */
  static deleted(res, { message = 'Deleted successfully' } = {}) {
    return res.json({ success: true, message });
  }
}

export default ApiResponse;
