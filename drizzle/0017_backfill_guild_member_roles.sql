UPDATE guild_role
SET is_default = true,
    updated_at = now()
WHERE name = 'Member'
  AND is_default = false;

INSERT INTO guild_role (
  id,
  guild_id,
  name,
  color,
  position,
  is_default,
  permissions,
  created_by
)
SELECT
  gen_random_uuid()::text,
  g.id,
  'Member',
  '#ff5b4f',
  COALESCE((
    SELECT MAX(existing.position) + 1
    FROM guild_role AS existing
    WHERE existing.guild_id = g.id
  ), 1),
  true,
  '{}'::jsonb,
  g.founder_id
FROM guild AS g
WHERE NOT EXISTS (
  SELECT 1
  FROM guild_role AS existing
  WHERE existing.guild_id = g.id
    AND existing.name = 'Member'
);
