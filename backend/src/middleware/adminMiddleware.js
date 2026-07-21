const userRepository = require("../repositories/userRepository");

module.exports = async (req, res, next) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ success: false, error: "Unauthorized access" });
    }

    try {
        const user = await userRepository.findById(req.user.userId);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ success: false, error: "Access denied. Admin privileges required." });
        }

        req.adminUser = user; // Attach full user object for subsequent handlers
        next();
    } catch (error) {
        console.error("[AdminMiddleware] Error verifying role:", error);
        return res.status(500).json({ success: false, error: "Internal server error during authorization check" });
    }
};
