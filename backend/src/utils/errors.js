const ErrorCodes = {
    // Auth Errors
    AUTH_INVALID_CREDENTIALS: "AUTH_001",
    AUTH_TOKEN_EXPIRED: "AUTH_002",
    AUTH_UNAUTHORIZED: "AUTH_003",
    AUTH_REGISTRATION_FAILED: "AUTH_004",

    // Validation Errors
    VALIDATION_FAILED: "VALIDATION_001",

    // Learn Errors
    LEARN_TRACK_NOT_FOUND: "LEARN_001",
    LEARN_MODULE_NOT_FOUND: "LEARN_002",
    LEARN_PAGE_NOT_FOUND: "LEARN_003",

    // Career Errors
    CAREER_PLAN_NOT_FOUND: "CAREER_001",

    // Interview Errors
    INTERVIEW_NOT_FOUND: "INTERVIEW_001",

    // Admin Errors
    ADMIN_ACCESS_REQUIRED: "ADMIN_001",
    ADMIN_OPERATION_FAILED: "ADMIN_002",

    // AI Errors
    AI_GENERATION_FAILED: "AI_001",

    // General Errors
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_001",
    INTERNAL_SERVER_ERROR: "SYSTEM_500",
    NOT_FOUND: "SYSTEM_404"
};

class APIError extends Error {
    constructor(message, status = 500, code = ErrorCodes.INTERNAL_SERVER_ERROR, errors = []) {
        super(message);
        this.status = status;
        this.code = code;
        this.errors = errors;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends APIError {
    constructor(message = "Validation Failed", errors = []) {
        super(message, 400, ErrorCodes.VALIDATION_FAILED, errors);
    }
}

class AuthenticationError extends APIError {
    constructor(message = "Authentication Required", code = ErrorCodes.AUTH_UNAUTHORIZED) {
        super(message, 401, code);
    }
}

class AuthorizationError extends APIError {
    constructor(message = "Forbidden Access", code = ErrorCodes.AUTH_UNAUTHORIZED) {
        super(message, 403, code);
    }
}

class NotFoundError extends APIError {
    constructor(message = "Resource Not Found", code = ErrorCodes.NOT_FOUND) {
        super(message, 404, code);
    }
}

class RateLimitError extends APIError {
    constructor(message = "Too many requests. Please try again later.", code = ErrorCodes.RATE_LIMIT_EXCEEDED) {
        super(message, 429, code);
    }
}

module.exports = {
    ErrorCodes,
    APIError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    RateLimitError
};
