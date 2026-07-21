const pino = require("pino");
const { contextStorage } = require("../utils/context");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  mixin() {
    const store = contextStorage.getStore();
    return store ? { requestId: store.requestId } : {};
  },
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "yyyy-mm-dd HH:MM:ss.l o",
      ignore: "pid,hostname"
    }
  }
});

module.exports = logger;