import { uid, type CamadaImagem, type EstiloBalao } from "@/lib/db";

export const FORMATOS_BALAO: { valor: EstiloBalao["formato"]; nome: string }[] = [
  { valor: "oval", nome: "Oval" }, { valor: "redondo", nome: "Redondo" },
  { valor: "quadrado", nome: "Quadrado" }, { valor: "irregular", nome: "Irregular" },
  { valor: "pensamento", nome: "Pensamento" }, { valor: "grito", nome: "Grito" },
  { valor: "narracao", nome: "Narração" },
];
export function novoBalao(formato: EstiloBalao["formato"] = "oval"): CamadaImagem {
  return { id: uid(), imagem: "", nome: "Novo balão", x: 50, y: 35, largura: 55, proporcao: 1.5, rotacao: 0, opacidade: 100,
    balao: { formato, texto: "Sua fala aqui", altura: 34, fundo: "var(--balloon-paper)", corTexto: "var(--balloon-ink)", corBorda: "var(--balloon-ink)",
      espessura: 2, borda: "solida", fonte: "Space Grotesk", tamanhoFonte: 18, negrito: true, italico: false,
      alinhamento: "center", sombra: 0, efeito: "nenhum", cauda: formato !== "narracao", caudaX: 72, caudaY: 135,
      baseX: 65, baseY: 85, larguraCauda: 16 } };
}

/** Coordinates remain local to the balloon even when it is rotated. */
export function pontoLocal(x: number, y: number, largura: number, altura: number, rotacao: number) {
  const rad = rotacao * Math.PI / 180;
  return { x: (x * Math.cos(rad) + y * Math.sin(rad)) / largura * 100,
    y: (-x * Math.sin(rad) + y * Math.cos(rad)) / altura * 100 };
}