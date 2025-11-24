-- =========================================================
-- SCHEMA HEYTERS - PostgreSQL
-- =========================================================

-- =========================================================
-- 1. USUARIOS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    display_name    VARCHAR(100) NOT NULL,
    email           VARCHAR(120) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    bio             TEXT,
    avatar_url      TEXT,
    country         VARCHAR(80),
    city            VARCHAR(80),
    role            VARCHAR(20) NOT NULL DEFAULT 'basic',     -- basic, pro, admin
    can_rap         BOOLEAN      NOT NULL DEFAULT FALSE,
    can_moderate    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_demo_user    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    is_pro          BOOLEAN      NOT NULL DEFAULT FALSE,      -- Acceso rápido a estado Pro
    pro_expires_at  TIMESTAMP,                                 -- Fecha de expiración de Pro
    total_battles   INTEGER      NOT NULL DEFAULT 0,          -- Estadísticas
    total_wins      INTEGER      NOT NULL DEFAULT 0,          -- Estadísticas
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_is_pro ON users (is_pro);


-- Trigger simple para updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =========================================================
-- 2. PLANES Y SUSCRIPCIONES (MONETIZACIÓN)
-- =========================================================

CREATE TABLE IF NOT EXISTS plans (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50)  NOT NULL UNIQUE,    -- ej: 'FREE', 'PRO_MONTHLY'
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    price_cents     INTEGER      NOT NULL DEFAULT 0,
    currency        VARCHAR(10)  NOT NULL DEFAULT 'USD',
    interval        VARCHAR(20)  NOT NULL DEFAULT 'month', -- month, year
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id                          BIGSERIAL PRIMARY KEY,
    user_id                     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    plan_id                     BIGINT      NOT NULL REFERENCES plans (id),
    status                      VARCHAR(30) NOT NULL DEFAULT 'active', -- active, canceled, past_due
    current_period_start        TIMESTAMP   NOT NULL,
    current_period_end          TIMESTAMP   NOT NULL,
    cancel_at_period_end        BOOLEAN     NOT NULL DEFAULT FALSE,
    provider                    VARCHAR(50) NOT NULL DEFAULT 'stripe',
    provider_subscription_id    VARCHAR(120),
    created_at                  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);


CREATE TABLE IF NOT EXISTS payments (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    amount_cents            INTEGER     NOT NULL,
    currency                VARCHAR(10) NOT NULL DEFAULT 'USD',
    provider                VARCHAR(50) NOT NULL DEFAULT 'stripe',
    provider_payment_id     VARCHAR(120),
    status                  VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending, succeeded, failed, refunded
    type                    VARCHAR(30) NOT NULL DEFAULT 'one_time', -- one_time, subscription
    description             TEXT,
    raw_response            JSONB,
    created_at              TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments (user_id);


-- =========================================================
-- 3. BATALLAS
-- =========================================================

CREATE TABLE IF NOT EXISTS battles (
    id                      BIGSERIAL PRIMARY KEY,
    title                   VARCHAR(150) NOT NULL,
    description             TEXT,
    status                  VARCHAR(30)  NOT NULL DEFAULT 'scheduled', -- scheduled, live, finished, cancelled
    visibility              VARCHAR(20)  NOT NULL DEFAULT 'public',    -- public, private
    password_hash           VARCHAR(255),
    mode                    VARCHAR(20)  NOT NULL DEFAULT '1v1',       -- 1v1, 2v2, openmic
    language                VARCHAR(10)  NOT NULL DEFAULT 'es',
    max_rounds              INTEGER      NOT NULL DEFAULT 3,
    round_duration_seconds  INTEGER      NOT NULL DEFAULT 90,
    battle_state            VARCHAR(20)  NOT NULL DEFAULT 'pending',   -- pending, running, finished
    round_state             VARCHAR(20)  NOT NULL DEFAULT 'pending',   -- pending, running, finished
    current_round           INTEGER      NOT NULL DEFAULT 1,
    current_turn            VARCHAR(20),
    round_time_remaining    INTEGER,
    round_started_at        TIMESTAMP,
    active_round_id         BIGINT,
    created_by              BIGINT       NOT NULL REFERENCES users (id),
    scheduled_at            TIMESTAMP,
    started_at              TIMESTAMP,
    ended_at                TIMESTAMP,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_battles_status ON battles (status);
CREATE INDEX IF NOT EXISTS idx_battles_created_by ON battles (created_by);


CREATE TABLE IF NOT EXISTS battle_participants (
    id              BIGSERIAL PRIMARY KEY,
    battle_id       BIGINT      NOT NULL REFERENCES battles (id) ON DELETE CASCADE,
    user_id         BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'viewer',   -- mc1, mc2, moderator, viewer
    slot_number     INTEGER,
    is_winner       BOOLEAN     NOT NULL DEFAULT FALSE,
    score           NUMERIC(5,2),
    joined_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
    left_at         TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS u_battle_participants_unique
ON battle_participants (battle_id, user_id);


CREATE TABLE IF NOT EXISTS battle_rounds (
    id                      BIGSERIAL PRIMARY KEY,
    battle_id               BIGINT      NOT NULL REFERENCES battles (id) ON DELETE CASCADE,
    round_number            INTEGER      NOT NULL,
    theme                   VARCHAR(200),
    beat_url                TEXT,
    started_at              TIMESTAMP,
    ended_at                TIMESTAMP,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS u_battle_rounds_unique
ON battle_rounds (battle_id, round_number);


CREATE TABLE IF NOT EXISTS battle_votes (
    id                  BIGSERIAL PRIMARY KEY,
    battle_id           BIGINT      NOT NULL REFERENCES battles (id) ON DELETE CASCADE,
    round_id            BIGINT      REFERENCES battle_rounds (id) ON DELETE CASCADE,
    voter_id            BIGINT      REFERENCES users (id) ON DELETE SET NULL,
    target_user_id      BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    score_style         VARCHAR(30) NOT NULL DEFAULT 'total', -- total, flow, lyric, stage
    score               NUMERIC(5,2) NOT NULL DEFAULT 0,
    metadata            JSONB,
    created_at          TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_battle_votes_battle_id ON battle_votes (battle_id);


-- =========================================================
-- 3.5 EVENTOS ESPECIALES
-- =========================================================

CREATE TABLE IF NOT EXISTS event_requests (
    id                  BIGSERIAL PRIMARY KEY,
    requester_id        BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title               VARCHAR(150) NOT NULL,
    opponent_name       VARCHAR(150),
    description         TEXT,
    event_date          TIMESTAMP   NOT NULL,
    entry_fee_cents     INTEGER     NOT NULL DEFAULT 0,
    commission_percent  INTEGER     NOT NULL DEFAULT 20,
    location            VARCHAR(150) NOT NULL DEFAULT 'Por confirmar',
    event_format        VARCHAR(30)  NOT NULL DEFAULT 'online', -- online, presencial, mixto
    capacity            INTEGER,
    cover_url           TEXT,
    stream_url          TEXT,
    requirements        TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    admin_notes         TEXT,
    created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_requests_status ON event_requests (status);
CREATE INDEX IF NOT EXISTS idx_event_requests_date ON event_requests (event_date);

CREATE TABLE IF NOT EXISTS event_tickets (
    id              BIGSERIAL PRIMARY KEY,
    event_id        BIGINT      NOT NULL REFERENCES event_requests (id) ON DELETE CASCADE,
    user_id         BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    price_paid_cents INTEGER    NOT NULL DEFAULT 0,
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS u_event_tickets_unique
ON event_tickets (event_id, user_id);


-- =========================================================
-- 4. COMENTARIOS Y REACCIONES
-- =========================================================

CREATE TABLE IF NOT EXISTS comments (
    id                  BIGSERIAL PRIMARY KEY,
    battle_id           BIGINT      NOT NULL REFERENCES battles (id) ON DELETE CASCADE,
    user_id             BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    parent_comment_id   BIGINT      REFERENCES comments (id) ON DELETE CASCADE,
    content             TEXT        NOT NULL,
    is_deleted          BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_battle_id ON comments (battle_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);


CREATE TABLE IF NOT EXISTS comment_reactions (
    id              BIGSERIAL PRIMARY KEY,
    comment_id      BIGINT      NOT NULL REFERENCES comments (id) ON DELETE CASCADE,
    user_id         BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    reaction_type   VARCHAR(20) NOT NULL, -- like, fire, boo, etc.
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS u_comment_reactions_unique
ON comment_reactions (comment_id, user_id, reaction_type);


-- =========================================================
-- 5. LOGROS (ACHIEVEMENTS)
-- =========================================================

CREATE TABLE IF NOT EXISTS achievements (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50)  NOT NULL UNIQUE,   -- ej: 'FIRST_BATTLE', 'TEN_WINS'
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    icon_url        TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    achievement_id      BIGINT      NOT NULL REFERENCES achievements (id) ON DELETE CASCADE,
    unlocked_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
    progress            INTEGER     NOT NULL DEFAULT 0,
    completed           BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS u_user_achievements_unique
ON user_achievements (user_id, achievement_id);


-- =========================================================
-- 6. NOTIFICACIONES
-- =========================================================

CREATE TABLE IF NOT EXISTS notifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,  -- 'BATTLE_INVITE', 'PAYMENT_SUCCESS', etc.
    title           VARCHAR(150) NOT NULL,
    body            TEXT        NOT NULL,
    data            JSONB,
    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    read_at         TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);


-- =========================================================
-- 7. SESIONES / REFRESH TOKENS
-- =========================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token           VARCHAR(255) NOT NULL UNIQUE,
    user_agent      TEXT,
    ip_address      VARCHAR(64),
    is_revoked      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMP,
    expires_at      TIMESTAMP   NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);


-- =========================================================
-- 8. LOGS / AUDITORÍA BÁSICA
-- =========================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      REFERENCES users (id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,  -- ej: 'BATTLE_CREATED', 'PAYMENT_FAILED'
    entity_type     VARCHAR(50),
    entity_id       BIGINT,
    metadata        JSONB,
    ip_address      VARCHAR(64),
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);


-- =========================================================
-- 9. ESTADÍSTICAS DE PLATAFORMA (ADMIN)
-- =========================================================

CREATE TABLE IF NOT EXISTS platform_stats (
    id              BIGSERIAL PRIMARY KEY,
    date            DATE NOT NULL UNIQUE,
    total_users     INTEGER NOT NULL DEFAULT 0,
    pro_users       INTEGER NOT NULL DEFAULT 0,
    new_users       INTEGER NOT NULL DEFAULT 0,
    total_battles   INTEGER NOT NULL DEFAULT 0,
    active_battles  INTEGER NOT NULL DEFAULT 0,
    revenue_cents   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_stats_date ON platform_stats (date);


-- =========================================================
-- 10. DATOS INICIALES - PLANES
-- =========================================================

-- Plan Pro Mensual ($5.000 CLP)
INSERT INTO plans (code, name, description, price_cents, currency, interval, is_active)
VALUES (
    'PRO_MONTHLY',
    'Plan Pro',
    'Acceso completo: participa en batallas, vota, chatea y más',
    500000,
    'CLP',
    'month',
    TRUE
) ON CONFLICT (code) DO UPDATE SET
    price_cents = 500000,
    currency = 'CLP',
    name = 'Plan Pro',
    description = 'Acceso completo: participa en batallas, vota, chatea y más';

-- Plan Básico (Gratis)
INSERT INTO plans (code, name, description, price_cents, currency, interval, is_active)
VALUES (
    'BASIC',
    'Plan Básico',
    'Ve resúmenes de batallas y explora la comunidad',
    0,
    'CLP',
    'month',
    TRUE
) ON CONFLICT (code) DO UPDATE SET
    price_cents = 0,
    name = 'Plan Básico',
    description = 'Ve resúmenes de batallas y explora la comunidad';


-- =========================================================
-- 11. TRIGGERS updated_at
-- =========================================================

-- Users
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Plans
DROP TRIGGER IF EXISTS trg_plans_updated_at ON plans;
CREATE TRIGGER trg_plans_updated_at
BEFORE UPDATE ON plans
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Subscriptions
DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Payments
DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Battles
DROP TRIGGER IF EXISTS trg_battles_updated_at ON battles;
CREATE TRIGGER trg_battles_updated_at
BEFORE UPDATE ON battles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Event requests
DROP TRIGGER IF EXISTS trg_event_requests_updated_at ON event_requests;
CREATE TRIGGER trg_event_requests_updated_at
BEFORE UPDATE ON event_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Comments
DROP TRIGGER IF EXISTS trg_comments_updated_at ON comments;
CREATE TRIGGER trg_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

