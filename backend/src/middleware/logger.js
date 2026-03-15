const pinoHttp = require("pino-http");
const logger = require("../config/logger");

module.exports = pinoHttp({
  logger
});