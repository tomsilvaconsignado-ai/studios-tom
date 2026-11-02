CREATE TABLE public.revista_versoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revista_id uuid NOT NULL REFERENCES public.revistas(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  estilo text NOT NULL DEFAULT '',
  formato text NOT NULL DEFAULT 'retrato',
  dados jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.revista_versoes (revista_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.revista_versoes TO anon, authenticated;
GRANT ALL ON public.revista_versoes TO service_role;
ALTER TABLE public.revista_versoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso aberto versoes" ON public.revista_versoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);