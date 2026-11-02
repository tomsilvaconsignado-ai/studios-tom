import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { apagarRevista, criarRevista, ESTILOS, listarEstilosPersonalizados, listarRevistas } from "@/lib/db";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Suas Revistas — Studios Tom" },
      { name: "description", content: "Suas revistas em quadrinhos, salvas e prontas para continuar de qualquer lugar." },
      { property: "og:title", content: "Suas Revistas — Studios Tom" },
      { property: "og:description", content: "Páginas ilimitadas, personagens que nunca mudam." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: Revistas,
});

function Revistas() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: revistas = [], isLoading } = useQuery({ queryKey: ["revistas"], queryFn: listarRevistas });
  const { data: meusEstilos = [] } = useQuery({ queryKey: ["estilos-personalizados"], queryFn: listarEstilosPersonalizados });
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [formato, setFormato] = useState("retrato");
  const [estilo, setEstilo] = useState<string>(ESTILOS[0]!);
  const [criando, setCriando] = useState(false);

  async function criar() {
    setCriando(true);
    try {
      const id = await criarRevista(nome.trim() || "Nova revista", formato, estilo);
      qc.invalidateQueries({ queryKey: ["revistas"] });
      nav({ to: "/projeto/$id", params: { id } });
    } catch {
      toast.error("Não foi possível criar a revista.");
      setCriando(false);
    }
  }

  async function apagar(id: string) {
    if (!confirm("Apagar esta revista?")) return;
    await apagarRevista(id);
    qc.invalidateQueries({ queryKey: ["revistas"] });
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl">Suas Revistas</h1>
            <p className="text-muted-foreground">Páginas ilimitadas, personagens que nunca mudam.</p>
          </div>
          <button className="comic-btn" onClick={() => setAberto(true)}>
            <Plus className="size-4" /> Nova revista
          </button>
        </div>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Carregando…</p>
        ) : revistas.length === 0 ? (
          <div className="comic-card mt-8 flex flex-col items-center gap-2 py-14 text-center">
            <BookOpen className="size-12" />
            <h2 className="text-3xl">Nenhuma revista ainda</h2>
            <p className="text-muted-foreground">
              Comece criando seus personagens no Banco de Personagens, depois crie sua primeira revista.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {revistas.map((r) => (
              <div key={r.id} className="comic-card group relative">
                <Link to="/projeto/$id" params={{ id: r.id }} className="block">
                  <div className="flex aspect-[3/4] items-start overflow-hidden border-b-2 bg-canvas">
                    {r.dados?.capa?.imagem ? (
                      <img src={r.dados.capa.imagem} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="m-3 bg-foreground px-2 font-display text-2xl text-highlight">{r.nome}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-display text-xl">{r.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.dados?.paginas?.length ?? 0} páginas · editada {new Date(r.updated_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </Link>
                <button
                  aria-label="Apagar"
                  onClick={() => apagar(r.id)}
                  className="absolute right-2 top-2 border-2 bg-card p-1 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="comic-card w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl">Nova revista</h2>
              <button aria-label="Fechar" onClick={() => setAberto(false)}><X /></button>
            </div>
            <label className="block text-sm font-semibold">
              Nome da revista
              <input className="comic-input mt-1" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
            </label>
            <div className="text-sm font-semibold">
              Formato
              <div className="mt-1 flex gap-2">
                {([["retrato", "Retrato (A4)"], ["quadrado", "Quadrado"], ["paisagem", "Paisagem"]] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setFormato(v)}
                    className={`comic-btn-light ${formato === v ? "!bg-highlight" : ""}`}>{l}</button>
                ))}
              </div>
            </div>
            <label className="block text-sm font-semibold">
              Estilo de arte global
              <select className="comic-input mt-1" value={estilo} onChange={(e) => setEstilo(e.target.value)}>
                 <optgroup label="Predefinidos">{ESTILOS.map((s) => <option key={s}>{s}</option>)}</optgroup>
                 <optgroup label="Meus Estilos">{meusEstilos.map((s) => <option key={s.id} value={`Meu Estilo: ${s.nome}`}>{s.nome}</option>)}</optgroup>
              </select>
            </label>
            <button className="comic-btn w-full justify-center" onClick={criar} disabled={criando}>
              {criando ? "Criando…" : "Criar e abrir editor"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
