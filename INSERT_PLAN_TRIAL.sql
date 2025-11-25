-- Insertar plan Pro Trial de 10 días (pago único para testing con MercadoPago)
INSERT INTO plans (code, name, description, price_cents, currency, interval, is_active)
VALUES (
  'pro_trial_10d',
  'Pro Trial - 10 Días',
  'Plan de prueba por 10 días con acceso completo: participar en batallas, votar, chat en vivo, crear batallas. Pago único sin renovación automática. Perfecto para probar Heyters antes de comprometerte al plan mensual.',
  200000, -- $2000 CLP
  'CLP',
  'month', -- Usamos month pero durará 10 días
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
SELECT * FROM plans WHERE code = 'pro_trial_10d';
