import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const analisarEstilo = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ imagens: z.array(z.string().startsWith("data:image/")).min(1).max(6) }).parse(data))
  .handler(async ({ data }) => {
    const { analyzeArtStyle } = await import("./style-analysis.server");
    return analyzeArtStyle(data.imagens);
  });