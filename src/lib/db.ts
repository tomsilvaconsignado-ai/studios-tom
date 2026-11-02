import { supabase } from "@/integrations/supabase/client";

export type EstiloBalao = {
  formato: "oval" | "redondo" | "quadrado" | "irregular" | "pensamento" | "grito" | "narracao";
  texto: string; altura: number; fundo: string; corTexto: string; corBorda: string;
  espessura: number; borda: "solida" | "tracejada" | "pontilhada";
  fonte: string; tamanhoFonte: number; negrito: boolean; italico: boolean;
  alinhamento: "left" | "center" | "right"; sombra: number;
  efeito: "nenhum" | "contorno"; cauda: boolean; caudaX: number; caudaY: number;
  baseX: number; baseY: number; larguraCauda: number;
};
export type CamadaImagem = {
  id: string;
  imagem: string;
  nome: string;
  x: number;
  y: number;
  largura: number;
  proporcao: number;
  rotacao: number;
  opacidade: number;
  balao?: EstiloBalao;
};
export type ModeloBalao = { id: string; nome: string; camada: CamadaImagem };
export type CamadaCapa = {
  id: string;
  tipo: "imagem" | "texto";
  nome: string;
  x: number;
  y: number;
  largura: number;
  proporcao: number;
  rotacao: number;
  opacidade: number;
  bloqueada: boolean;
  imagem?: string;
  texto?: string;
  tamanhoFonte?: number;
  cor?: string;
  zoom?: number;
  enquadramentoX?: number;
  enquadramentoY?: number;
  ajuste?: "conter" | "recortar";
};
export type ModeloCapa = { id: string; nome: string; imagem?: string; camadas: CamadaCapa[] };
export type Enquadramento = { zoom: number; x: number; y: number; ajuste: "conter" | "preencher" };
export type ContextoCena = {
  personagens: { nome: string; posicao: string; postura: string; expressao: string; olhar: string; roupa: string; acessorios: string; estado: string }[];
  cenario: { local: string; objetos: string; arquitetura: string; iluminacao: string; clima: string; horario: string };
  acao: { acontecendo: string; mudou: string };
  continuidade: { manter: string[]; podeMudar: string[]; introduzidos: string[]; removidos: string[] };
};
export type Quadro = { id: string; texto: string; balao: string; imagem?: string | undefined; camadas?: CamadaImagem[]; enquadramento?: Enquadramento; contexto?: ContextoCena; mudancas?: string[] };
export type Pagina = { id: string; historiaId: string; layout: string; quadros: Quadro[]; personagens: string[]; baloes?: CamadaImagem[] };
export type Historia = { id: string; titulo: string; descricao: string };
export type DadosRevista = {
  historias: Historia[];
  paginas: Pagina[];
  capa: { titulo: string; subtitulo: string; cena?: string; imagem?: string | undefined; camadas?: CamadaCapa[]; modelos?: ModeloCapa[] };
  contracapa: { texto: string };
  versoCapa?: { texto: string };
  versoContracapa?: { texto: string };
  estiloPersonalizadoId?: string;
  modelosBaloes?: ModeloBalao[];
  continuidade?: { ativa: boolean; nivel: "baixa" | "media" | "alta" | "muito-alta" };
};
export type Revista = {
  id: string; nome: string; formato: string; estilo: string;
  dados: DadosRevista; updated_at: string;
};
export type Personagem = {
  id: string; nome: string; descricao: string; roupa: string; papel: string;
  personalidade: string; tags: string; imagens: string[]; travado: boolean;
};
export type EstiloPersonalizado = {
  id: string; nome: string; descricao: string; prompt_estilo: string;
  imagens: string[]; created_at: string; updated_at: string;
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const LAYOUTS: { id: string; nome: string; grupo: string; cols: number; rows: number; areas: string[] }[] = [
  { id: "1", nome: "1 quadro", grupo: "Clássicos", cols: 1, rows: 1, areas: ["1/1/2/2"] },
  { id: "2h", nome: "2 horizontais", grupo: "Clássicos", cols: 1, rows: 2, areas: ["1/1/2/2", "2/1/3/2"] },
  { id: "3f", nome: "3 faixas", grupo: "Clássicos", cols: 1, rows: 3, areas: ["1/1/2/2", "2/1/3/2", "3/1/4/2"] },
  { id: "2x2", nome: "Grade 2x2", grupo: "Clássicos", cols: 2, rows: 2, areas: ["1/1/2/2", "1/2/2/3", "2/1/3/2", "2/2/3/3"] },
  { id: "6", nome: "Clássico 6", grupo: "Clássicos", cols: 2, rows: 3, areas: ["1/1/2/2", "1/2/2/3", "2/1/3/2", "2/2/3/3", "3/1/4/2", "3/2/4/3"] },
  { id: "dest", nome: "Destaque", grupo: "Clássicos", cols: 2, rows: 3, areas: ["1/1/3/3", "3/1/4/2", "3/2/4/3"] },
  { id: "2v", nome: "2 verticais", grupo: "Verticais e mistos", cols: 2, rows: 1, areas: ["1/1/2/2", "1/2/2/3"] },
  { id: "vme", nome: "Vertical maior à esquerda", grupo: "Verticais e mistos", cols: 3, rows: 1, areas: ["1/1/2/3", "1/3/2/4"] },
  { id: "vmd", nome: "Vertical maior à direita", grupo: "Verticais e mistos", cols: 3, rows: 1, areas: ["1/1/2/2", "1/2/2/4"] },
  { id: "v2h", nome: "Vertical e 2 horizontais", grupo: "Verticais e mistos", cols: 2, rows: 2, areas: ["1/1/3/2", "1/2/2/3", "2/2/3/3"] },
  { id: "pan3", nome: "Panorama e 3 verticais", grupo: "Verticais e mistos", cols: 3, rows: 2, areas: ["1/1/2/4", "2/1/3/2", "2/2/3/3", "2/3/3/4"] },
  { id: "d4", nome: "Destaque com 4 quadros", grupo: "Verticais e mistos", cols: 2, rows: 4, areas: ["1/1/3/3", "3/1/4/2", "3/2/4/3", "4/1/5/2", "4/2/5/3"] },
];

export const ESTILOS = ["HQ anos 90 (realista)", "Mangá", "Cartoon clássico", "Europeu (linha clara)", "Noir preto e branco", "Aquarela"];

export function quadrosPara(layoutId: string, antigos: Quadro[] = []): Quadro[] {
  const l = LAYOUTS.find((x) => x.id === layoutId) ?? LAYOUTS[4]!;
  return l.areas.map((_, i) => antigos[i] ?? { id: uid(), texto: "", balao: "" });
}

export function novaRevistaDados(nome: string): DadosRevista {
  const h = { id: uid(), titulo: "História 1", descricao: "" };
  return {
    historias: [h],
    paginas: [{ id: uid(), historiaId: h.id, layout: "6", quadros: quadrosPara("6"), personagens: [] }],
    capa: { titulo: nome, subtitulo: "" },
    contracapa: { texto: "Espaço publicitário" },
  };
}

export async function listarRevistas() {
  const { data, error } = await supabase.from("revistas").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data as unknown as Revista[];
}
export async function obterRevista(id: string) {
  const { data, error } = await supabase.from("revistas").select("*").eq("id", id).single();
  if (error) throw error;
  return data as unknown as Revista;
}
export async function criarRevista(nome: string, formato: string, estilo: string) {
  const { data, error } = await supabase.from("revistas")
    .insert({ nome, formato, estilo, dados: novaRevistaDados(nome) as never }).select("id").single();
  if (error) throw error;
  return data.id as string;
}
export async function salvarRevista(r: Revista) {
  const { error } = await supabase.from("revistas").update({
    nome: r.nome, formato: r.formato, estilo: r.estilo, dados: r.dados as never, updated_at: new Date().toISOString(),
  }).eq("id", r.id);
  if (error) throw error;
}
export async function apagarRevista(id: string) {
  const { error } = await supabase.from("revistas").delete().eq("id", id);
  if (error) throw error;
}
export async function duplicarRevista(r: Revista) {
  const nome = `${r.nome} — nova edição`;
  const dados = structuredClone(r.dados);
  dados.capa.titulo = nome;
  const { data, error } = await supabase.from("revistas").insert({ nome, formato: r.formato, estilo: r.estilo, dados: dados as never }).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function listarPersonagens() {
  const { data, error } = await supabase.from("personagens").select("*").order("created_at");
  if (error) throw error;
  return data as Personagem[];
}
export async function salvarPersonagem(p: Partial<Personagem> & { id?: string }) {
  const body = { ...p, updated_at: new Date().toISOString() };
  if (p.id) {
    const { error } = await supabase.from("personagens").update(body).eq("id", p.id);
    if (error) throw error;
    return p.id;
  }
  const { data, error } = await supabase.from("personagens").insert(body).select("id").single();
  if (error) throw error;
  return data.id as string;
}
export async function apagarPersonagem(id: string) {
  const { error } = await supabase.from("personagens").delete().eq("id", id);
  if (error) throw error;
}

export async function listarEstilosPersonalizados() {
  const { data, error } = await supabase.from("estilos_personalizados").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data as EstiloPersonalizado[];
}
export async function salvarEstiloPersonalizado(estilo: Partial<EstiloPersonalizado> & Pick<EstiloPersonalizado, "nome" | "descricao" | "prompt_estilo" | "imagens">) {
  const body = { nome: estilo.nome, descricao: estilo.descricao, prompt_estilo: estilo.prompt_estilo, imagens: estilo.imagens, updated_at: new Date().toISOString() };
  if (estilo.id) {
    const { error } = await supabase.from("estilos_personalizados").update(body).eq("id", estilo.id);
    if (error) throw error;
    return estilo.id;
  }
  const { data, error } = await supabase.from("estilos_personalizados").insert(body).select("id").single();
  if (error) throw error;
  return data.id as string;
}
export async function apagarEstiloPersonalizado(id: string) {
  const { error } = await supabase.from("estilos_personalizados").delete().eq("id", id);
  if (error) throw error;
}

/** Reduz uma imagem e devolve como texto para guardar junto aos dados. */
export function imagemParaTexto(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * s; c.height = img.height * s;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/** Preserva transparência de PNG e informa a proporção original da camada. */
export function imagemCamadaParaTexto(file: File, max = 1200): Promise<{ imagem: string; proporcao: number }> {
  return new Promise((resolve, reject) => {
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      reject(new Error("A imagem deve ser JPG ou PNG."));
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const proporcao = img.naturalWidth / img.naturalHeight;
      const escala = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error("Não foi possível preparar a imagem.")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const tipo = file.type === "image/png" ? "image/png" : "image/jpeg";
      const imagem = canvas.toDataURL(tipo, tipo === "image/jpeg" ? 0.88 : undefined);
      URL.revokeObjectURL(url);
      resolve({ imagem, proporcao });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível abrir a imagem.")); };
    img.src = url;
  });
}

export type Versao = { id: string; revista_id: string; nome: string; estilo: string; formato: string; dados: DadosRevista; created_at: string };
export async function criarVersao(r: Revista) {
  const { error } = await supabase.from("revista_versoes").insert({
    revista_id: r.id, nome: r.nome, estilo: r.estilo, formato: r.formato, dados: r.dados as never,
  });
  if (error) throw error;
}
export async function listarVersoes(revistaId: string) {
  const { data, error } = await supabase.from("revista_versoes")
    .select("id, revista_id, nome, estilo, formato, created_at").eq("revista_id", revistaId)
    .order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data as Omit<Versao, "dados">[];
}
export async function obterVersao(id: string) {
  const { data, error } = await supabase.from("revista_versoes").select("*").eq("id", id).single();
  if (error) throw error;
  return data as unknown as Versao;
}

/** Move balões antigos (presos ao quadro) para a camada livre da página, convertendo coordenadas. */
export function migrarBaloesParaPagina(p: Pagina) {
  const l = LAYOUTS.find((x) => x.id === p.layout) ?? LAYOUTS[4]!;
  p.quadros.forEach((q, i) => {
    const soltos = (q.camadas ?? []).filter((c) => c.balao);
    if (!soltos.length) return;
    const [r1, c1, r2, c2] = (l.areas[i] ?? "1/1/2/2").split("/").map(Number) as [number, number, number, number];
    const left = (c1 - 1) / l.cols * 100, w = (c2 - c1) / l.cols * 100, top = (r1 - 1) / l.rows * 100, h = (r2 - r1) / l.rows * 100;
    p.baloes = [...(p.baloes ?? []), ...soltos.map((c) => ({ ...c, x: left + c.x * w / 100, y: top + c.y * h / 100, largura: c.largura * w / 100,
      balao: { ...c.balao!, altura: c.balao!.altura * h / 100 } }))];
    q.camadas = (q.camadas ?? []).filter((c) => !c.balao);
  });
}
