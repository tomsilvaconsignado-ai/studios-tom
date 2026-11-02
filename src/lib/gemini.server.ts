// Integração com a API do Google Gemini. Somente servidor: a chave nunca vai para o navegador.
// Substitui o gateway Lovable (image-gateway.server.ts fica no projeto, sem uso, para facilitar uma volta atrás).

const API = "https://generativelanguage.googleapis.com/v1beta/models";

export const geminiModelos = {
  imagem: () => process.env["GEMINI_IMAGE_MODEL"] || "gemini-3.1-flash-image",
  texto: () => process.env["GEMINI_TEXT_MODEL"] || "gemini-3.5-flash-lite",
};

type Parte = { text: string } | { inlineData: { mimeType: string; data: string } };

export class ErroGemini extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function chave() {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new ErroGemini("A IA está indisponível no momento (chave do Gemini não configurada).", 500);
  return apiKey;
}

/** Proporções aceitas pelos modelos de imagem do Gemini. */
const PROPORCOES = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"] as const;

/** Converte "LARGURAxALTURA" (calculado por tamanhoParaPainel) na proporção suportada mais próxima. */
export function proporcaoGemini(size?: string): string | undefined {
  const m = /^(\d+)x(\d+)$/.exec(size ?? "");
  if (!m) return undefined;
  const alvo = Math.log(Number(m[1]) / Number(m[2]));
  let melhor: string = PROPORCOES[0];
  let erro = Infinity;
  for (const p of PROPORCOES) {
    const [w, h] = p.split(":").map(Number);
    const e = Math.abs(Math.log(w! / h!) - alvo);
    if (e < erro) { erro = e; melhor = p; }
  }
  return melhor;
}

/** data:image/...;base64,... → parte inlineData do Gemini. */
export function dataUrlParaParte(url: string): Parte {
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(url);
  if (!m) throw new ErroGemini("Imagem de referência inválida.", 400);
  return { inlineData: { mimeType: m[1]!, data: m[2]! } };
}

export async function arquivoParaParte(arquivo: File): Promise<Parte> {
  const bytes = Buffer.from(await arquivo.arrayBuffer());
  return { inlineData: { mimeType: arquivo.type || "image/jpeg", data: bytes.toString("base64") } };
}

function mensagemDeErro(status: number, corpo: string) {
  if (status === 429) {
    if (/free_tier|limit: 0/i.test(corpo)) return "Cota do Gemini esgotada no plano gratuito. Ative o faturamento no Google AI Studio para gerar imagens.";
    return "Muitas solicitações à IA. Tente novamente em instantes.";
  }
  if (status === 400 && /API key/i.test(corpo)) return "Chave do Gemini inválida.";
  if (status === 403) return "A chave do Gemini não tem permissão para este modelo.";
  return "A IA não respondeu agora. Tente novamente.";
}

async function gerarConteudo(modelo: string, corpo: Record<string, unknown>, signal?: AbortSignal) {
  const res = await fetch(`${API}/${modelo}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": chave() },
    body: JSON.stringify(corpo),
    signal: signal ?? null,
  });
  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    console.error(`Gemini ${modelo} respondeu ${res.status}: ${texto.slice(0, 500)}`);
    throw new ErroGemini(mensagemDeErro(res.status, texto), res.status === 429 ? 429 : 502);
  }
  return (await res.json()) as {
    candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean; inlineData?: { mimeType: string; data: string } }[] } }[];
    promptFeedback?: { blockReason?: string };
  };
}

/** Gera (ou edita, quando há imagens de referência) uma imagem. Retorna base64 e tipo. */
export async function gerarImagemGemini(prompt: string, referencias: Parte[], size?: string, signal?: AbortSignal) {
  const aspectRatio = proporcaoGemini(size);
  const imageSize = process.env["GEMINI_IMAGE_SIZE"];
  const r = await gerarConteudo(
    geminiModelos.imagem(),
    {
      contents: [{ role: "user", parts: [{ text: prompt }, ...referencias] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        ...(aspectRatio || imageSize ? { imageConfig: { ...(aspectRatio ? { aspectRatio } : {}), ...(imageSize ? { imageSize } : {}) } } : {}),
      },
    },
    signal,
  );
  const cand = r.candidates?.[0];
  const img = cand?.content?.parts?.find((p) => p.inlineData && !p.thought)?.inlineData;
  if (!img) {
    const motivo = r.promptFeedback?.blockReason || cand?.finishReason;
    throw new ErroGemini(
      motivo && /SAFETY|PROHIBITED|BLOCK|IMAGE_SAFETY/i.test(motivo)
        ? "A IA recusou esta cena pelo filtro de segurança. Reescreva a descrição."
        : "A IA não devolveu nenhuma imagem. Tente novamente.",
      422,
    );
  }
  return { b64: img.data, mime: img.mimeType || "image/png" };
}

/** Pede uma resposta em JSON seguindo o esquema dado (análise de estilo e continuidade). */
export async function respostaJsonGemini(instrucoes: string, partes: Parte[], schema: Record<string, unknown>) {
  const r = await gerarConteudo(geminiModelos.texto(), {
    systemInstruction: { parts: [{ text: instrucoes }] },
    contents: [{ role: "user", parts: partes }],
    generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema },
  });
  const texto = (r.candidates?.[0]?.content?.parts ?? []).filter((p) => p.text && !p.thought).map((p) => p.text).join("");
  if (!texto) throw new ErroGemini("A IA não devolveu uma resposta.", 502);
  return JSON.parse(texto) as unknown;
}

/**
 * Resposta no mesmo formato SSE que o editor já entende (stream-image.ts).
 * O Gemini não envia imagens parciais: mantém a conexão viva com comentários e manda só o evento final.
 */
export function respostaImagemSSE(tipo: "image_generation" | "image_edit", gerar: (signal: AbortSignal) => Promise<{ b64: string; mime: string }>, request: Request) {
  const enc = new TextEncoder();
  const corpo = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      // Depois que o navegador desiste, enqueue lança erro; ignorar é seguro.
      const enviar = (texto: string) => { try { ctrl.enqueue(enc.encode(texto)); } catch { /* conexão fechada */ } };
      const vivo = setInterval(() => enviar(": aguardando\n\n"), 10000);
      const evento = (nome: string, dados: unknown) => enviar(`event: ${nome}\ndata: ${JSON.stringify(dados)}\n\n`);
      try {
        const { b64, mime } = await gerar(request.signal);
        evento(`${tipo}.completed`, { type: `${tipo}.completed`, b64_json: b64, mime });
      } catch (e) {
        if (!request.signal.aborted) {
          evento("error", { type: "error", error: { message: e instanceof ErroGemini ? e.message : "Não foi possível criar a imagem." } });
          if (!(e instanceof ErroGemini)) console.error(e);
        }
      } finally {
        clearInterval(vivo);
        try { ctrl.close(); } catch { /* conexão fechada */ }
      }
    },
  });
  return new Response(corpo, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" } });
}

/** Resposta sem streaming, no formato { data: [{ b64_json }] } que o editor usa como alternativa. */
export async function respostaImagemJSON(gerar: () => Promise<{ b64: string; mime: string }>) {
  try {
    const { b64, mime } = await gerar();
    return Response.json({ data: [{ b64_json: b64, mime }] });
  } catch (e) {
    const erro = e instanceof ErroGemini ? e : new ErroGemini("Não foi possível criar a imagem.", 500);
    return new Response(erro.message, { status: erro.status });
  }
}
