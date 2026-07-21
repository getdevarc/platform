const { contextStorage } = require("./context");

const getRequestId = () => {
  const store = contextStorage.getStore();
  return store ? store.requestId : null;
};

/**
 * Standardized success response builder.
 */
exports.success = (res, data = null, message = "Success", status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
    requestId: getRequestId(),
    timestamp: new Date().toISOString()
  });
};

/**
 * Standardized error response builder.
 */
exports.error = (res, message = "An error occurred", status = 500, code = "SYSTEM_500", error = null, errors = []) => {
  // Maintain backward compatibility by populating both message and error fields
  const errorDetail = error || message;

  return res.status(status).json({
    success: false,
    data: null,
    message,
    error: errorDetail,
    requestId: getRequestId(),
    timestamp: new Date().toISOString(),
    code,
    errors
  });
};