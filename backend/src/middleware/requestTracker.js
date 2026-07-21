const crypto = require("crypto");
const { contextStorage } = require("../utils/context");

module.exports = (req, res, next) => {
    const requestId = req.headers["x-request-id"] || crypto.randomUUID();

    // Inject correlation ID into request properties and response headers
    req.id = requestId;
    res.setHeader("x-request-id", requestId);

    // Save requestId in AsyncLocalStorage for downstream logs context tracking
    contextStorage.run({ requestId }, () => {
        next();
    });
};
