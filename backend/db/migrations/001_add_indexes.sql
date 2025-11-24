-- ================================================================
-- ÍNDICES CRÍTICOS PARA PRODUCCIÓN
-- Ejecutar antes de ir a producción
-- ================================================================

-- Battle votes - índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_battle_votes_round_voter
ON battle_votes (round_id, voter_id, battle_id);

CREATE INDEX IF NOT EXISTS idx_battle_votes_voter_id
ON battle_votes (voter_id);

CREATE INDEX IF NOT EXISTS idx_battle_votes_target_user
ON battle_votes (target_user_id);

-- Battle participants - índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_battle_participants_user_id
ON battle_participants (user_id, battle_id);

-- Notifications - índice para notificaciones no leídas
CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read
ON notifications (user_id, is_read) WHERE is_read = FALSE;

-- Subscriptions - índice para suscripciones activas
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_user
ON subscriptions (user_id, status) WHERE status = 'active';

-- Battles - índice para batallas programadas
CREATE INDEX IF NOT EXISTS idx_battles_status_scheduled_at
ON battles (status, scheduled_at) WHERE status = 'scheduled';

-- Payments - índice para búsquedas por usuario y estado
CREATE INDEX IF NOT EXISTS idx_payments_user_status
ON payments (user_id, status);

-- ================================================================
-- CONSTRAINTS DE VALIDACIÓN
-- ================================================================

-- Validar roles de usuario
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT check_user_role
  CHECK (role IN ('basic', 'pro', 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Validar estados de batalla
DO $$ BEGIN
  ALTER TABLE battles ADD CONSTRAINT check_battle_status
  CHECK (status IN ('scheduled', 'live', 'finished', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Validar roles de participante
DO $$ BEGIN
  ALTER TABLE battle_participants ADD CONSTRAINT check_participant_role
  CHECK (role IN ('mc1', 'mc2', 'moderator', 'viewer'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Validar estados de suscripción
DO $$ BEGIN
  ALTER TABLE subscriptions ADD CONSTRAINT check_subscription_status
  CHECK (status IN ('active', 'canceled', 'past_due'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Validar montos positivos
DO $$ BEGIN
  ALTER TABLE payments ADD CONSTRAINT check_payment_amount
  CHECK (amount_cents >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE plans ADD CONSTRAINT check_plan_price
  CHECK (price_cents >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================================
-- VERIFICACIÓN
-- ================================================================
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
