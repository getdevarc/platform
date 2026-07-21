type LogLevel = "debug" | "info" | "warn" | "error";

const RUNTIME_ENV = process.env.NODE_ENV;
const CONSOLE_LEVEL: LogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) ||
    (RUNTIME_ENV === "development" ? "debug" : "info");

const LEVEL_VALUES: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

function canLog(level: LogLevel): boolean {
    return LEVEL_VALUES[level] >= LEVEL_VALUES[CONSOLE_LEVEL];
}

export const logger = {
    debug(module: string, message: string, metadata?: unknown) {
        if (!canLog("debug")) return;
        console.debug(
            `%c[DEBUG] [${module}] %c${message}`,
            "color: #78716c; font-weight: bold; font-family: monospace;",
            "color: #a8a29e;",
            metadata !== undefined ? metadata : ""
        );
    },

    info(module: string, message: string, metadata?: unknown) {
        if (!canLog("info")) return;
        console.info(
            `%c[INFO] [${module}] %c${message}`,
            "color: #3b82f6; font-weight: bold; font-family: monospace;",
            "color: #e2e8f0;",
            metadata !== undefined ? metadata : ""
        );
    },

    warn(module: string, message: string, metadata?: unknown) {
        if (!canLog("warn")) return;
        console.warn(
            `%c[WARN] [${module}] %c${message}`,
            "color: #f59e0b; font-weight: bold; font-family: monospace;",
            "color: #fbbf24;",
            metadata !== undefined ? metadata : ""
        );
    },

    error(module: string, message: string, metadata?: unknown) {
        if (!canLog("error")) return;
        console.error(
            `%c[ERROR] [${module}] %c${message}`,
            "color: #ef4444; font-weight: bold; font-family: monospace;",
            "color: #fca5a5;",
            metadata !== undefined ? metadata : ""
        );
    }
};
