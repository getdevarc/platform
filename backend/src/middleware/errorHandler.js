const logger = require("../config/logger");
const response = require("../utils/response");
const { APIError, ErrorCodes } = require("../utils/errors");

module.exports = (err, req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || "Internal Server Error";
  let code = err.code || ErrorCodes.INTERNAL_SERVER_ERROR;
  let errors = err.errors || [];

  // Log details
  logger.error({
    err: {
      message: err.message,
      stack: err.stack,
      status,
      code,
      errors
    },
    url: req.originalUrl,
    method: req.method
  }, `Request failed with error [${code}]: ${message}`);

  // Send standardized error response
  return response.error(res, message, status, code, err.message, errors);
};