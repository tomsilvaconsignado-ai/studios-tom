-- Somente esquema publico; consolidacao original, nao executada.
-- Requer destino vazio com roles anon/authenticated/service_role e Data API/RLS.
-- Nao aplicar apos restaurar export que ja inclua schema. Sem dados/segredos.

-- Origem: drizzle/migrations/0000_migration.sql
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

-- Origem: drizzle/migrations/0001_migration.sql
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

-- Origem: drizzle/migrations/0002_create_custom_art_styles.sql
CREATE TABLE public.estilos_personalizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  prompt_estilo TEXT NOT NULL DEFAULT '',
  imagens JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estilos_personalizados TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estilos_personalizados TO authenticated;
GRANT ALL ON public.estilos_personalizados TO service_role;
ALTER TABLE public.estilos_personalizados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Estilos personalizados visiveis publicamente" ON public.estilos_personalizados FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Estilos personalizados podem ser criados publicamente" ON public.estilos_personalizados FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Estilos personalizados podem ser alterados publicamente" ON public.estilos_personalizados FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Estilos personalizados podem ser excluidos publicamente" ON public.estilos_personalizados FOR DELETE TO anon, authenticated USING (true);

