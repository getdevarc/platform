-- Migration: Observability Schema Setup
-- Handles logging of platform health metrics and database keep-alive statuses

CREATE TABLE IF NOT EXISTS system_health_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_type          VARCHAR(55) NOT NULL, -- 'DATABASE', 'AI_SERVICE', 'KEEP_ALIVE', 'RETENTION', 'APP_HEALTH'
    status              VARCHAR(20) NOT NULL, -- 'UP', 'DOWN'
    response_time_ms    INTEGER NOT NULL,
    details             TEXT,
    created_at          TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index created_at on logs tracking table to speed up purging and dashboard analytics queries
CREATE INDEX IF NOT EXISTS idx_system_health_logs_created_at ON system_health_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_check_type ON system_health_logs(check_type);
