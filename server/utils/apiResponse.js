export const sendSuccess = (res, data = null, statusCode = 200, meta = undefined) => {
  const payload = { data };
  if (meta !== undefined) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
};

export const sendError = (res, statusCode, code, message, details = undefined) => {
  const payload = {
    error: {
      code,
      message
    }
  };
  if (details !== undefined) {
    payload.error.details = details;
  }
  return res.status(statusCode).json(payload);
};
