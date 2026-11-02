import { z } from "zod";
import { dataUrlParaParte, respostaJsonGemini } from "./gemini.server";

const schema = z.object({
  nome: z.string(),
  descricao: z.string(),
  promptEstilo: z.string(),
});

export async function analyzeArtStyle(imagens: string[]) {
  try {
    const resposta = await respostaJsonGemini(
      "Você é diretor de arte de histórias em quadrinhos. Analise somente características visuais, sem identificar o artista. Responda em português. O prompt deve ser detalhado e reutilizável para manter consistência entre cenas, descrevendo traço, contorno, espessura de linha, anatomia e proporções, expressões, sombras, hachuras, paleta, acabamento e composição.",
      [
        { text: "Crie um nome curto no formato Estilo [nome evocativo] – [categoria], uma descrição clara e um prompt visual consistente a partir destas referências." },
        ...imagens.map(dataUrlParaParte),
      ],
      {
        type: "object",
        additionalProperties: false,
        required: ["nome", "descricao", "promptEstilo"],
        properties: {
          nome: { type: "string" },
          descricao: { type: "string" },
          promptEstilo: { type: "string" },
        },
      },
    );
    return schema.parse(resposta);
  } catch (e) {
    if (e instanceof Error && e.name !== "ZodError" && !(e instanceof SyntaxError)) throw e;
    throw new Error("Não foi possível analisar o estilo agora.");
  }
}
