import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ImagePlus, Pencil, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { analisarEstilo } from "@/lib/style-analysis.functions";
import { apagarEstiloPersonalizado, imagemParaTexto, listarEstilosPersonalizados, salvarEstiloPersonalizado, type EstiloPersonalizado } from "@/lib/db";

export const Route = createFileRoute("/estilos")({
  head: () => ({ meta: [{ title: "Meus Estilos — Studios Tom" }, { name: "description", content: "Crie e gerencie estilos de arte próprios a partir dos seus desenhos." }, { property: "og:title", content: "Meus Estilos — Studios Tom" }, { property: "og:description", content: "Referências visuais consistentes para suas revistas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  ssr: false,
  component: Estilos,
});

function Estilos() {
  const qc = useQueryClient();
  const { data: estilos = [] } = useQuery({ queryKey: ["estilos-personalizados"], queryFn: listarEstilosPersonalizados });
  const [imagens, setImagens] = useState<string[]>([]); const [analisando, setAnalisando] = useState(false);
  const criar = async () => {
    if (!imagens.length) { toast.error("Anexe ao menos um desenho."); return; }
    setAnalisando(true);
    try { const a = await analisarEstilo({ data: { imagens } }); await salvarEstiloPersonalizado({ nome: a.nome, descricao: a.descricao, prompt_estilo: a.promptEstilo, imagens }); setImagens([]); await qc.invalidateQueries({ queryKey: ["estilos-personalizados"] }); toast.success("Seu estilo foi criado e salvo."); }
    catch (e) { const m = e instanceof Error ? e.message : ""; toast.error(m.includes("402") ? "Créditos de IA esgotados. Adicione créditos em Configurações → Planos." : "Não foi possível analisar os desenhos."); return; }
    setAnalisando(false);
  };
  const renomear = async (e: EstiloPersonalizado) => { const nome = prompt("Novo nome do estilo", e.nome)?.trim(); if (!nome) return; await salvarEstiloPersonalizado({ ...e, nome }); qc.invalidateQueries({ queryKey: ["estilos-personalizados"] }); };
  return <><Header /><main className="mx-auto max-w-6xl px-6 py-10"><h1 className="text-5xl">Meus Estilos</h1><p className="text-muted-foreground">Transforme seus desenhos em uma direção visual consistente para toda a revista.</p>
    <section className="mt-7 border-y-2 bg-secondary py-6"><div className="grid gap-6 lg:grid-cols-[1fr_auto]"><div><h2 className="text-3xl">Criar estilo pelo seu traço</h2><div className="mt-3 flex flex-wrap gap-3">{imagens.map((img, i) => <img key={i} src={img} alt={`Referência ${i + 1}`} className="size-28 border-2 bg-card object-contain" />)}<label className="flex size-28 cursor-pointer flex-col items-center justify-center border-2 border-dashed bg-card text-center text-xs font-semibold"><ImagePlus className="size-6" />Anexar desenhos<input hidden multiple type="file" accept="image/jpeg,image/png" onChange={async (ev) => { const files = [...(ev.target.files ?? [])].slice(0, 6 - imagens.length); setImagens([...imagens, ...(await Promise.all(files.map((f) => imagemParaTexto(f, 700))))]); ev.currentTarget.value = ""; }} /></label></div></div><button className="comic-btn self-end" disabled={analisando || !imagens.length} onClick={criar}><Sparkles className="size-4" />{analisando ? "Analisando traço…" : "Criar Meu Estilo"}</button></div></section>
    <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{estilos.map((e) => <article key={e.id} className="comic-card overflow-hidden"><div className="grid aspect-[3/2] grid-cols-3 bg-canvas">{e.imagens.slice(0, 3).map((img, i) => <img key={i} src={img} alt="" className="h-full w-full object-cover" />)}</div><div className="space-y-2 p-4"><h2 className="text-2xl">{e.nome}</h2><p className="text-sm">{e.descricao}</p><div className="flex gap-2"><button className="comic-btn-light" onClick={() => renomear(e)}><Pencil className="size-4" />Renomear</button><button className="comic-btn-light" onClick={async () => { const { id: _id, ...copia } = e; await salvarEstiloPersonalizado({ ...copia, nome: `${e.nome} — cópia` }); qc.invalidateQueries({ queryKey: ["estilos-personalizados"] }); }}><Copy className="size-4" /></button><button className="comic-btn-light" onClick={async () => { if (confirm("Excluir este estilo?")) { await apagarEstiloPersonalizado(e.id); qc.invalidateQueries({ queryKey: ["estilos-personalizados"] }); } }}><Trash2 className="size-4" /></button></div></div></article>)}</div>
  </main></>;
}