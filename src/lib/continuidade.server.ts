import { dataUrlParaParte, respostaJsonGemini } from "./gemini.server";

type Conteudo = { type: "input_text"; text: string } | { type: "input_image"; image_url: string };

async function chamarIA(instrucoes: string, conteudo: Conteudo[], _nome: string, schema: Record<string, unknown>) {
  const partes = conteudo.map((c) => (c.type === "input_text" ? { text: c.text } : dataUrlParaParte(c.image_url)));
  try {
    return await respostaJsonGemini(instrucoes, partes, schema);
  } catch (e) {
    if (e instanceof SyntaxError) throw new Error("Não foi possível analisar a continuidade agora.");
    throw e;
  }
}

const lista = { type: "array", items: { type: "string" } };
const contextoSchema = {
  type: "object", additionalProperties: false,
  required: ["personagens", "cenario", "acao", "continuidade"],
  properties: {
    personagens: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["nome", "posicao", "postura", "expressao", "olhar", "roupa", "acessorios", "estado"],
      properties: { nome: { type: "string" }, posicao: { type: "string" }, postura: { type: "string" }, expressao: { type: "string" }, olhar: { type: "string" }, roupa: { type: "string" }, acessorios: { type: "string" }, estado: { type: "string" } } } },
    cenario: { type: "object", additionalProperties: false,
      required: ["local", "objetos", "arquitetura", "iluminacao", "clima", "horario"],
      properties: { local: { type: "string" }, objetos: { type: "string" }, arquitetura: { type: "string" }, iluminacao: { type: "string" }, clima: { type: "string" }, horario: { type: "string" } } },
    acao: { type: "object", additionalProperties: false, required: ["acontecendo", "mudou"],
      properties: { acontecendo: { type: "string" }, mudou: { type: "string" } } },
    continuidade: { type: "object", additionalProperties: false, required: ["manter", "podeMudar", "introduzidos", "removidos"],
      properties: { manter: lista, podeMudar: lista, introduzidos: lista, removidos: lista } },
  },
};

export function analisarCenaIA(imagem: string, descricao: string, fichas: string, anterior: string) {
  return chamarIA(
    "Você é supervisor de continuidade de histórias em quadrinhos. Descreva em português, de forma objetiva e curta, o estado visual deste painel para garantir continuidade nos próximos: posições (esquerda/direita/frente/fundo), olhar, mão que segura objetos, roupas com cores, ferimentos, sujeira, danos, veículos, objetos, cenário, iluminação, clima e horário. Use os nomes das fichas quando reconhecer os personagens.",
    [
      { type: "input_text", text: `Descrição do painel: ${descricao || "(sem descrição)"}\n\nFichas:\n${fichas || "(nenhuma)"}\n\nContexto anterior:\n${anterior || "(início da cena)"}` },
      { type: "input_image", image_url: imagem },
    ],
    "contexto_cena", contextoSchema,
  );
}

export function verificarContinuidadeIA(contextos: string, descricao: string, fichas: string, imagem?: string) {
  return chamarIA(
    "Você é supervisor de continuidade de quadrinhos. Compare a descrição do NOVO painel com a memória da cena e as fichas. Aponte somente conflitos reais ou omissões importantes (roupa diferente, objeto em outra mão, ferimento esquecido, troca de dia/noite, cenário trocado, personagem do lado oposto sem motivo). Para cada problema: 'mensagem' curta em português explicando o que havia antes; 'manter' = instrução para o gerador preservar a continuidade; 'alterar' = instrução que registra a mudança deliberada pedida pelo usuário. Se não houver conflitos, retorne lista vazia.",
    [
      { type: "input_text", text: `Memória da cena:\n${contextos || "(sem memória)"}\n\nFichas:\n${fichas || "(nenhuma)"}\n\nNovo painel: ${descricao || "(sem descrição)"}` },
      ...(imagem ? [{ type: "input_image" as const, image_url: imagem }] : []),
    ],
    "verificacao",
    { type: "object", additionalProperties: false, required: ["problemas"], properties: { problemas: { type: "array", items: { type: "object", additionalProperties: false, required: ["mensagem", "manter", "alterar"], properties: { mensagem: { type: "string" }, manter: { type: "string" }, alterar: { type: "string" } } } } } },
  ) as Promise<{ problemas: { mensagem: string; manter: string; alterar: string }[] }>;
}
