import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dataUrlParaParte, gerarImagemGemini, proporcaoGemini, respostaImagemSSE, respostaJsonGemini } from "@/lib/gemini.server";

function respostaGemini(corpo: unknown, status = 200) {
  return new Response(typeof corpo === "string" ? corpo : JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}

describe("gemini", () => {
  beforeEach(() => { process.env["GEMINI_API_KEY"] = "teste"; vi.spyOn(console, "error").mockImplementation(() => {}); });
  afterEach(() => { vi.restoreAllMocks(); delete process.env["GEMINI_API_KEY"]; });

  it("escolhe a proporção suportada mais próxima do painel", () => {
    expect(proporcaoGemini("1024x1024")).toBe("1:1");
    expect(proporcaoGemini("768x1024")).toBe("3:4");
    expect(proporcaoGemini("1792x1024")).toBe("16:9");
    expect(proporcaoGemini("2048x688")).toBe("21:9");
    expect(proporcaoGemini(undefined)).toBeUndefined();
  });

  it("converte data URL em inlineData", () => {
    expect(dataUrlParaParte("data:image/png;base64,QUJD")).toEqual({ inlineData: { mimeType: "image/png", data: "QUJD" } });
    expect(() => dataUrlParaParte("http://x/y.png")).toThrow();
  });

  it("gera imagem com proporção e referências e devolve base64 e tipo", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      respostaGemini({ candidates: [{ content: { parts: [{ text: "ok" }, { inlineData: { mimeType: "image/jpeg", data: "SU1H" } }] } }] }),
    );
    const r = await gerarImagemGemini("cena", [{ inlineData: { mimeType: "image/png", data: "UkVG" } }], "768x1024");
    expect(r).toEqual({ b64: "SU1H", mime: "image/jpeg" });
    const corpo = JSON.parse(String(fetchMock.mock.calls[0]![1]!.body));
    expect(corpo.generationConfig.imageConfig.aspectRatio).toBe("3:4");
    expect(corpo.contents[0].parts).toHaveLength(2);
    expect(String(fetchMock.mock.calls[0]![0])).toContain("gemini-3.1-flash-image:generateContent");
  });

  it("explica a recusa do filtro de segurança", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(respostaGemini({ candidates: [{ finishReason: "IMAGE_SAFETY", content: { parts: [] } }] }));
    await expect(gerarImagemGemini("cena", [])).rejects.toThrow(/filtro de segurança/);
  });

  it("avisa quando a cota gratuita não permite imagens", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(respostaGemini('{"error":{"message":"free_tier limit: 0"}}', 429));
    await expect(gerarImagemGemini("cena", [])).rejects.toThrow(/faturamento/);
  });

  it("devolve JSON estruturado", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(respostaGemini({ candidates: [{ content: { parts: [{ text: '{"nome":"Noir"}' }] } }] }));
    await expect(respostaJsonGemini("instr", [{ text: "x" }], { type: "object" })).resolves.toEqual({ nome: "Noir" });
  });

  it("responde no formato SSE que o editor entende", async () => {
    const ok = respostaImagemSSE("image_edit", async () => ({ b64: "SU1H", mime: "image/jpeg" }), new Request("http://x"));
    expect(ok.headers.get("Content-Type")).toBe("text/event-stream");
    expect(await ok.text()).toBe('event: image_edit.completed\ndata: {"type":"image_edit.completed","b64_json":"SU1H","mime":"image/jpeg"}\n\n');
    vi.spyOn(globalThis, "fetch").mockResolvedValue(respostaGemini({ candidates: [{ finishReason: "SAFETY" }] }));
    const erro = respostaImagemSSE("image_generation", () => gerarImagemGemini("cena", []), new Request("http://x"));
    expect(await erro.text()).toMatch(/^event: error\ndata: .*filtro de segurança/);
  });
});
