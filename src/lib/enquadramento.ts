/** OpenAI image dimensions: multiples of 16, at least 655,360 pixels, up to 3:1. */
export function tamanhoParaPainel(proporcao: number) {
  const r = Math.max(1 / 3, Math.min(3, proporcao));
  let melhor = { w: 1024, h: 1024, erro: Infinity };
  for (let h = 640; h <= 2048; h += 16) {
    const w = Math.round(h * r / 16) * 16;
    if (w < 640 || w > 2048 || w * h < 655360 || w / h < 1 / 3 || w / h > 3) continue;
    const erro = Math.abs(w / h - r) / r + Math.abs(w * h - 1500000) / 1500000 * 0.0001;
    if (erro < melhor.erro) melhor = { w, h, erro };
  }
  return `${melhor.w}x${melhor.h}`;
}
export const ENQUADRAMENTO_ORIGINAL = { zoom: 100, x: 0, y: 0, ajuste: "conter" as const };