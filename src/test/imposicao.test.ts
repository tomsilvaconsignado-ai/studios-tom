import { describe, expect, it } from "vitest";
import { impor, ordemLeitura, paginasFaltando } from "@/lib/imposicao";

describe("imposição", () => {
  it("8 páginas", () => {
    expect(impor(8).map((f) => [f.frente, f.verso])).toEqual([[[7, 0], [1, 6]], [[5, 2], [3, 4]]]);
  });
  it("completa até múltiplo de 4", () => {
    expect(paginasFaltando(3)).toBe(1);
    expect(ordemLeitura(["a", "b", "c"], true)).toHaveLength(8);
    expect(ordemLeitura(["a", "b", "c", "d"], true)).toHaveLength(8);
  });
});
