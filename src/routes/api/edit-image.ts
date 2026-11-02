import { createFileRoute } from "@tanstack/react-router";
import { arquivoParaParte, gerarImagemGemini, respostaImagemJSON, respostaImagemSSE } from "@/lib/gemini.server";

export const Route = createFileRoute("/api/edit-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const prompt = form.get("prompt");
        const size = form.get("size");
        const imagens = [...form.entries()]
          .filter(([nome, valor]) => (nome === "image" || nome === "image[]") && valor instanceof File)
          .map(([, valor]) => valor as File);
        if (typeof prompt !== "string" || !prompt.trim() || imagens.length === 0) {
          return new Response("Envie uma imagem e a descrição.", { status: 400 });
        }
        if (typeof size === "string" && size && !/^\d{3,4}x\d{3,4}$/.test(size)) return new Response("Formato de imagem inválido.", { status: 400 });
        const referencias = await Promise.all(imagens.map(arquivoParaParte));
        const tamanho = typeof size === "string" && size ? size : undefined;
        const gerar = (signal?: AbortSignal) => gerarImagemGemini(prompt, referencias, tamanho, signal);
        if (form.get("stream") === "false") return respostaImagemJSON(() => gerar());
        return respostaImagemSSE("image_edit", gerar, request);
      },
    },
  },
});
