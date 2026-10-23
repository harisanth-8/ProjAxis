import { sendError } from '../utils/apiResponse.js';

export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });

      // Assign parsed/sanitized values back to request
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;

      return next();
    } catch (err) {
      if (err.errors) {
        const issues = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }));
        return sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed for request data', issues);
      }
      return sendError(res, 400, 'BAD_REQUEST', err.message || 'Malformed request');
    }
  };
};
