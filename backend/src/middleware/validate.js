const { ValidationError } = require("../utils/errors");

module.exports = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errorDetails = result.error.errors.map(err => ({
      field: err.path.join("."),
      message: err.message
    }));
    return next(new ValidationError("Validation Failed", errorDetails));
  }

  req.body = result.data;
  next();
};