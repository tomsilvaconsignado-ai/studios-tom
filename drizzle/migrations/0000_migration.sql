CREATE TABLE public.revistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT 'Sem título',
  formato text NOT NULL DEFAULT 'retrato',
  estilo text NOT NULL DEFAULT 'HQ anos 90 (realista)',
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.personagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  roupa text NOT NULL DEFAULT '',
  papel text NOT NULL DEFAULT 'Herói',
  personalidade text NOT NULL DEFAULT '',
  tags text NOT NULL DEFAULT '',
  imagens text[] NOT NULL DEFAULT '{}',
  travado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.revistas TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personagens TO anon, authenticated;
GRANT ALL ON public.revistas TO service_role;
GRANT ALL ON public.personagens TO service_role;
ALTER TABLE public.revistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso aberto revistas" ON public.revistas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso aberto personagens" ON public.personagens FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);