const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "jhaaman810@gmail.com";

/**
 * Checks if a user record matches the Super Administrator requirements.
 * supports future expansions for multiple emails or database flags.
 * @param {object} user - User record object containing email
 * @returns {boolean} True if user is a Super Administrator
 */
exports.isSuperAdmin = (user) => {
    if (!user || !user.email) return false;
    return user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
};

/**
 * Gets the configured Super Administrator email string.
 * @returns {string} Email
 */
exports.getSuperAdminEmail = () => {
    return SUPER_ADMIN_EMAIL;
};
