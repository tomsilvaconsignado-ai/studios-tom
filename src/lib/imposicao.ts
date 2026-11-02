/** Imposição para revista dobrada (caderno único, A4 paisagem, dobra ao meio). */
export type ItemImpressao =
  | { tipo: "capa" } | { tipo: "contracapa" } | { tipo: "versoCapa" } | { tipo: "versoContracapa" }
  | { tipo: "interna"; paginaId: string; numero: number } | { tipo: "branco" };

export type Folha = { numero: number; frente: [number, number]; verso: [number, number] };

/** Ordem de leitura: capa, verso da capa, internas, [preenchimento], verso da contracapa, contracapa. */
export function ordemLeitura(paginaIds: string[], completar: boolean): ItemImpressao[] {
  const internas: ItemImpressao[] = paginaIds.map((paginaId, i) => ({ tipo: "interna", paginaId, numero: i + 1 }));
  const total = internas.length + 4;
  const faltam = (4 - (total % 4)) % 4;
  const branco: ItemImpressao[] = completar ? Array.from({ length: faltam }, () => ({ tipo: "branco" })) : [];
  return [{ tipo: "capa" }, { tipo: "versoCapa" }, ...internas, ...branco, { tipo: "versoContracapa" }, { tipo: "contracapa" }];
}

export const paginasFaltando = (totalPaginasInternas: number) => (4 - ((totalPaginasInternas + 4) % 4)) % 4;

/** Índices (0-based na ordem de leitura) de cada lado de cada folha. Ex.: 8 pág. → [7|0] [1|6] / [5|2] [3|4]. */
export function impor(total: number): Folha[] {
  if (total % 4 !== 0) throw new Error("Total de páginas precisa ser múltiplo de 4.");
  return Array.from({ length: total / 4 }, (_, s) => ({
    numero: s + 1,
    frente: [total - 1 - 2 * s, 2 * s],
    verso: [2 * s + 1, total - 2 - 2 * s],
  }));
}

export function rotulo(item: ItemImpressao) {
  switch (item.tipo) {
    case "capa": return "Capa";
    case "contracapa": return "Contracapa";
    case "versoCapa": return "Verso da capa";
    case "versoContracapa": return "Verso da contracapa";
    case "branco": return "Em branco (preenchimento)";
    case "interna": return `Página ${item.numero}`;
  }
}
