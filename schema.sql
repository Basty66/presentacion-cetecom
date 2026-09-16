-- Ejecuta esto en Neon SQL Editor

CREATE TABLE IF NOT EXISTS presentation_room (
  id TEXT PRIMARY KEY DEFAULT 'main',
  slide INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO presentation_room (id, slide) VALUES ('main', 0)
ON CONFLICT (id) DO NOTHING;
