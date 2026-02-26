ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS certificado boolean DEFAULT false;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS fecha_certificacion timestamptz;

CREATE TABLE IF NOT EXISTS vendedor_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id uuid REFERENCES vendedores(id) ON DELETE CASCADE,
  nivel_completado integer NOT NULL CHECK (nivel_completado BETWEEN 1 AND 5),
  completed_at timestamptz DEFAULT now(),
  UNIQUE(vendedor_id, nivel_completado)
);

ALTER TABLE vendedor_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert vendedor_progress" ON vendedor_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select vendedor_progress" ON vendedor_progress FOR SELECT USING (true);