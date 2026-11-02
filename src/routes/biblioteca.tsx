import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Header } from "@/components/Header";
import { ESTILOS, listarEstilosPersonalizados, listarPersonagens, listarRevistas } from "@/lib/db";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca — Studios Tom" },
      { name: "description", content: "Reutilize personagens, estilos e capas antes de criar do zero." },
      { property: "og:title", content: "Biblioteca — Studios Tom" },
      { property: "og:description", content: "Reutilize antes de criar do zero." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: Biblioteca,
});

function Biblioteca() {
  const [aba, setAba] = useState("personagens");
  const { data: personagens = [] } = useQuery({ queryKey: ["personagens"], queryFn: listarPersonagens });
  const { data: revistas = [] } = useQuery({ queryKey: ["revistas"], queryFn: listarRevistas });
  const { data: meusEstilos = [] } = useQuery({ queryKey: ["estilos-personalizados"], queryFn: listarEstilosPersonalizados });
  const abas: [string, string][] = [
    ["personagens", `Personagens (${personagens.length})`],
    ["estilos", `Estilos de traço (${ESTILOS.length + meusEstilos.length})`],
    ["capas", `Capas anteriores (${revistas.length})`],
  ];
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-5xl">Biblioteca</h1>
        <p className="text-muted-foreground">Reutilize antes de criar do zero.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {abas.map(([id, l]) => (
            <button key={id} onClick={() => setAba(id)} className={`comic-btn-light ${aba === id ? "!bg-highlight" : ""}`}>{l}</button>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {aba === "personagens" && (personagens.length === 0
            ? <p className="text-muted-foreground">Nenhum personagem salvo.</p>
            : personagens.map((p) => (
              <Link to="/personagens" key={p.id} className="comic-card">
                <div className="aspect-square overflow-hidden border-b-2 bg-canvas">
                  {p.imagens[0] && <img src={p.imagens[0]} alt={p.nome} className="h-full w-full object-cover" />}
                </div>
                <p className="p-2 font-display text-xl">{p.nome}</p>
              </Link>
            )))}
          {aba === "estilos" && ESTILOS.map((s) => (
            <div key={s} className="comic-card p-4 font-display text-xl">{s}</div>
          ))}
          {aba === "estilos" && meusEstilos.map((s) => <Link to="/estilos" key={s.id} className="comic-card overflow-hidden"><div className="grid aspect-[3/2] grid-cols-3 bg-canvas">{s.imagens.slice(0, 3).map((img, i) => <img key={i} src={img} alt="" className="h-full w-full object-cover" />)}</div><div className="p-3"><p className="font-display text-xl">{s.nome}</p><p className="text-xs text-muted-foreground">Meu Estilo</p></div></Link>)}
          {aba === "capas" && (revistas.length === 0
            ? <p className="text-muted-foreground">Nenhuma capa ainda.</p>
            : revistas.map((r) => (
              <Link key={r.id} to="/projeto/$id" params={{ id: r.id }} className="comic-card">
                <div className="flex aspect-[3/4] items-start overflow-hidden bg-canvas">
                  {r.dados?.capa?.imagem
                    ? <img src={r.dados.capa.imagem} alt="" className="h-full w-full object-cover" />
                    : <span className="m-2 bg-foreground px-2 font-display text-xl text-highlight">{r.nome}</span>}
                </div>
              </Link>
            )))}
        </div>
      </main>
    </>
  );
}
