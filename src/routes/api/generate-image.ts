import { createFileRoute } from "@tanstack/react-router";
import { gerarImagemGemini, respostaImagemJSON, respostaImagemSSE } from "@/lib/gemini.server";

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt, stream = true, size } = (await request.json()) as { prompt?: string; stream?: boolean; size?: string };
        if (!prompt?.trim()) return new Response("Descreva a imagem.", { status: 400 });
        if (size && !/^\d{3,4}x\d{3,4}$/.test(size)) return new Response("Formato de imagem inválido.", { status: 400 });
        if (!stream) return respostaImagemJSON(() => gerarImagemGemini(prompt, [], size));
        return respostaImagemSSE("image_generation", (signal) => gerarImagemGemini(prompt, [], size, signal), request);
      },
    },
  },
});
