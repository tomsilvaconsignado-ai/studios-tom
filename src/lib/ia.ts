import { streamImage } from "@/lib/stream-image";
import type { Personagem } from "@/lib/db";
import { tamanhoParaPainel } from "@/lib/enquadramento";

function dataUrlParaArquivo(url: string, nome: string): File {
  const [cab, b64] = url.split(",");
  const tipo = /data:(.*?);/.exec(cab ?? "")?.[1] ?? "image/png";
  const bin = atob(b64 ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], nome, { type: tipo });
}

/** Reduz a imagem final para não pesar no salvamento. */
export function compactar(dataUrl: string, max = 1100): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * s; c.height = img.height * s;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function montarPrompt(opts: {
  cena: string; estilo: string; personagens: Personagem[]; tipo: "quadro" | "capa"; titulo?: string; estiloPersonalizado?: string;
}) {
  const fichas = opts.personagens.map((p) =>
    `- ${p.nome} (${p.papel}): ${p.descricao}${p.roupa ? `. Roupa: ${p.roupa}` : ""}`).join("\n");
  return [
    opts.tipo === "capa"
      ? `Capa de revista em quadrinhos${opts.titulo ? ` chamada "${opts.titulo}"` : ""}. Composição dramática de capa, com espaço livre no topo para o título; não escreva nenhum texto na imagem.`
      : "Um único quadro de história em quadrinhos. Não escreva textos, balões ou legendas na imagem.",
    `Estilo de arte: ${opts.estilo}.`,
    opts.estiloPersonalizado && `REFERÊNCIA DE ESTILO PRIORITÁRIA — mantenha este traço acima do estilo geral: ${opts.estiloPersonalizado}`,
    `Cena: ${opts.cena}`,
    fichas && `Personagens (mantenha exatamente o mesmo rosto, cabelo, corpo e roupas das imagens de referência, na ordem dada):\n${fichas}`,
  ].filter(Boolean).join("\n\n");
}

/** Gera a imagem; usa as fotos de referência dos personagens quando existirem. */
export async function gerarImagem(prompt: string, personagens: Personagem[], onFrame: (src: string, final: boolean) => void, referenciasEstilo: string[] = [], proporcao?: number, referenciasCena: string[] = []) {
  const size = proporcao ? tamanhoParaPainel(proporcao) : undefined;
  const instrucao = proporcao ? `${prompt}\n\nComponha a cena inteira para um painel com proporção largura/altura ${proporcao.toFixed(4)}. Preserve todos os personagens e elementos importantes dentro deste enquadramento. Não adicione margens ou molduras.` : prompt;
  const refs = [...referenciasCena.slice(0, 2), ...referenciasEstilo.slice(0, 3), ...personagens.flatMap((p) => p.imagens.slice(0, 2))].slice(0, 6);
  if (refs.length === 0) return streamImage("/api/generate-image", { prompt: instrucao, ...(size ? { size } : {}) }, onFrame);
  const form = new FormData();
  form.append("prompt", instrucao);
  if (size) form.append("size", size);
  refs.forEach((r, i) => form.append("image[]", dataUrlParaArquivo(r, `ref${i}.jpg`)));
  return streamImage("/api/edit-image", form, onFrame);
}
