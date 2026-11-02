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