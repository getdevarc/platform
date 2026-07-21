const { Server } = require("socket.io");
const logger = require("../config/logger");

let io = null;

const socketService = {
    init(server) {
        if (io) {
            logger.warn("[Socket.IO] Service already initialized.");
            return io;
        }

        logger.info("[Socket.IO] Initializing real-time synchronization server...");
        io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
            }
        });

        io.on("connection", (socket) => {
            logger.info(`[Socket.IO] Client connected: ${socket.id}`);

            socket.on("disconnect", () => {
                logger.info(`[Socket.IO] Client disconnected: ${socket.id}`);
            });
        });

        return io;
    },

    getIO() {
        return io;
    },

    emitCMSUpdate(entityType, targetId, payload = {}) {
        if (!io) {
            logger.warn("[Socket.IO] Cannot emit update. Server not initialized.");
            return false;
        }

        logger.info(`[Socket.IO] Emitting CMS update event: entity=${entityType}, targetId=${targetId}`);
        io.emit("cms:updated", {
            entityType,
            targetId,
            ...payload,
            timestamp: new Date().toISOString()
        });
        return true;
    }
};

module.exports = socketService;
