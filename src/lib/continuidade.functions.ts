import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ContextoCena } from "./db";

export const analisarCena = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ imagem: z.string().startsWith("data:image/"), descricao: z.string().max(4000), fichas: z.string().max(8000), anterior: z.string().max(12000) }).parse(d))
  .handler(async ({ data }) => {
    const { analisarCenaIA } = await import("./continuidade.server");
    return analisarCenaIA(data.imagem, data.descricao, data.fichas, data.anterior) as Promise<ContextoCena>;
  });

export const verificarContinuidade = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ contextos: z.string().max(20000), descricao: z.string().max(4000), fichas: z.string().max(8000), imagem: z.string().startsWith("data:image/").optional() }).parse(d))
  .handler(async ({ data }) => {
    const { verificarContinuidadeIA } = await import("./continuidade.server");
    return verificarContinuidadeIA(data.contextos, data.descricao, data.fichas, data.imagem);
  });
