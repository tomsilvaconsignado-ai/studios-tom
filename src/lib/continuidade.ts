import type { ContextoCena, DadosRevista, Personagem, Quadro } from "@/lib/db";

export type NivelContinuidade = "baixa" | "media" | "alta" | "muito-alta";
export const NIVEIS: { id: NivelContinuidade; nome: string }[] = [
  { id: "baixa", nome: "Baixa" }, { id: "media", nome: "Média" }, { id: "alta", nome: "Alta" }, { id: "muito-alta", nome: "Muito alta" },
];
const JANELA: Record<NivelContinuidade, number> = { baixa: 1, media: 2, alta: 4, "muito-alta": 10 };
const IMAGENS: Record<NivelContinuidade, number> = { baixa: 0, media: 1, alta: 1, "muito-alta": 2 };

/** Painéis anteriores da mesma história (Edição → História → Página → Painel). */
export function paineisAnteriores(d: DadosRevista, paginaId: string, quadroId: string) {
  const pag = d.paginas.find((p) => p.id === paginaId);
  if (!pag) return [] as { q: Quadro; rotulo: string }[];
  const out: { q: Quadro; rotulo: string }[] = [];
  for (const [ip, p] of d.paginas.entries()) {
    if (p.historiaId !== pag.historiaId) continue;
    for (const [iq, q] of p.quadros.entries()) {
      if (p.id === paginaId && q.id === quadroId) return out;
      out.push({ q, rotulo: `Página ${ip + 1}, painel ${iq + 1}` });
    }
  }
  return out;
}

export function contextoEmTexto(c?: Partial<ContextoCena>): string {
  if (!c || typeof c !== "object") return "";
  const x = c;
  const ps = (x.personagens ?? []).map((p) => `  - ${p.nome}: posição ${p.posicao}; postura ${p.postura}; olhar ${p.olhar}; expressão ${p.expressao}; roupa ${p.roupa}; acessórios ${p.acessorios}; estado/ferimentos ${p.estado}`).join("\n");
  const cn = x.cenario ? `Cenário: ${x.cenario.local}; objetos ${x.cenario.objetos}; arquitetura ${x.cenario.arquitetura}; iluminação ${x.cenario.iluminacao}; clima ${x.cenario.clima}; horário ${x.cenario.horario}` : "";
  const ac = x.acao ? `Ação: ${x.acao.acontecendo}. Mudou: ${x.acao.mudou}` : "";
  const ct = x.continuidade ? `Deve permanecer: ${(x.continuidade.manter ?? []).join("; ")}. Introduzidos: ${(x.continuidade.introduzidos ?? []).join("; ")}. Removidos: ${(x.continuidade.removidos ?? []).join("; ")}` : "";
  return [ps && `Personagens:\n${ps}`, cn, ac, ct].filter(Boolean).join("\n");
}

export function fichasEmTexto(ps: Personagem[]) {
  return ps.map((p) => `- ${p.nome} (${p.papel}): ${p.descricao}${p.roupa ? `. Roupa base: ${p.roupa}` : ""}${p.personalidade ? `. Personalidade: ${p.personalidade}` : ""}`).join("\n");
}

export function memoriaDaCena(d: DadosRevista, paginaId: string, quadroId: string, nivel: NivelContinuidade) {
  const ant = paineisAnteriores(d, paginaId, quadroId);
  const recentes = ant.slice(-JANELA[nivel]);
  const texto = recentes.map(({ q, rotulo }) => [
    `### ${rotulo}`, q.texto && `Roteiro: ${q.texto}`, contextoEmTexto(q.contexto), q.mudancas?.length ? `Mudanças registradas: ${q.mudancas.join("; ")}` : "",
  ].filter(Boolean).join("\n")).join("\n\n");
  // Memória longa: mudanças deliberadas registradas antes da janela continuam valendo.
  const antigas = ant.slice(0, -JANELA[nivel]).flatMap(({ q }) => q.mudancas ?? []);
  const longa = antigas.length ? `Mudanças registradas anteriormente na história: ${antigas.join("; ")}` : "";
  const imagens = ant.filter(({ q }) => q.imagem).slice(-IMAGENS[nivel]).map(({ q }) => q.imagem!).reverse();
  return { texto: [longa, texto].filter(Boolean).join("\n\n"), imagens, temAnterior: ant.length > 0 };
}

export function promptContinuidade(memoria: string, decisoes: string[], comImagem: boolean, nivel: NivelContinuidade) {
  if (!memoria && !decisoes.length) return "";
  return [
    `CONTINUIDADE (nível ${nivel}): este painel continua a sequência anterior; não é uma imagem independente. Crie NOVA composição e enquadramento conforme o roteiro, mas preserve a lógica visual: lado esquerdo/direito e distância dos personagens, direção do olhar e do movimento, roupas e cores, acessórios, objetos (e em qual mão estão), veículos, ferimentos, sujeira e danos, cenário, posição de portas/janelas/móveis, iluminação, clima e horário.`,
    comImagem && "A(s) primeira(s) imagem(ns) de referência é(são) o(s) painel(is) anterior(es): use-a(s) para manter o mesmo lugar e o mesmo estado dos personagens, sem copiá-la(s).",
    "Prioridade em conflitos: 1) instrução explícita do usuário; 2) roteiro; 3) continuidade estabelecida; 4) ficha do personagem; 5) painel anterior. A ficha define QUEM é o personagem; a memória define COMO ele está nesta cena.",
    decisoes.length && `Decisões do usuário (obrigatórias):\n${decisoes.map((x) => `- ${x}`).join("\n")}`,
    memoria && `MEMÓRIA DA CENA:\n${memoria}`,
  ].filter(Boolean).join("\n\n");
}
