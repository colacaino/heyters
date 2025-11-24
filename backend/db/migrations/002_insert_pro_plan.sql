-- ================================================================
-- INSERTAR PLAN PRO EN LA BASE DE DATOS
-- Ejecutar después de crear las tablas
-- ================================================================

-- Insertar el plan Pro mensual
INSERT INTO plans (code, name, description, price_cents, currency, interval, is_active)
VALUES (
  'pro_monthly',
  'Plan Pro Mensual',
  'Acceso completo a todas las funciones de Heyters: participar en batallas, votar, chat en vivo, crear batallas y más.',
  500000, -- 5000 CLP en centavos
  'CLP',
  'month',
  true
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  currency = EXCLUDED.currency,
  interval = EXCLUDED.interval,
  is_active = EXCLUDED.is_active;

-- Verificar que se insertó correctamente
SELECT * FROM plans WHERE code = 'pro_monthly';

-- ================================================================
-- PLAN ANUAL (OPCIONAL - con descuento)
-- ================================================================

INSERT INTO plans (code, name, description, price_cents, currency, interval, is_active)
VALUES (
  'pro_yearly',
  'Plan Pro Anual',
  'Acceso completo por un año con 2 meses gratis. Ahorra $10.000 CLP.',
  5000000, -- 50000 CLP en centavos (10 meses en vez de 12)
  'CLP',
  'year',
  true
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  currency = EXCLUDED.currency,
  interval = EXCLUDED.interval,
  is_active = EXCLUDED.is_active;

-- Verificar planes
SELECT id, code, name, price_cents/100 as price_clp, interval, is_active
FROM plans
ORDER BY price_cents;
