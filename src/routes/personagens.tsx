import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Lock, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { apagarPersonagem, imagemParaTexto, listarPersonagens, salvarPersonagem, type Personagem } from "@/lib/db";

export const Route = createFileRoute("/personagens")({
  head: () => ({
    meta: [
      { title: "Banco de Personagens — Studios Tom" },
      { name: "description", content: "Crie fichas de personagens com visual travado para usar em todas as revistas." },
      { property: "og:title", content: "Banco de Personagens — Studios Tom" },
      { property: "og:description", content: "Depois de travado, o visual de um personagem nunca muda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: Personagens,
});

const PAPEIS = ["Herói", "Vilão", "Coadjuvante", "Narrador", "Figurante"];
type Ficha = Partial<Personagem>;
const vazio = (): Ficha => ({ nome: "", descricao: "", roupa: "", papel: "Herói", personalidade: "", tags: "", imagens: [], travado: false });

function Personagens() {
  const qc = useQueryClient();
  const { data: lista = [] } = useQuery({ queryKey: ["personagens"], queryFn: listarPersonagens });
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [salvando, setSalvando] = useState(false);
  const set = (k: keyof Personagem, v: unknown) => setFicha((f) => ({ ...f!, [k]: v }));

  async function salvar(travar = false) {
    if (!ficha) return;
    if (!ficha.nome?.trim()) { toast.error("Dê um nome ao personagem."); return; }
    setSalvando(true);
    try {
      const id = await salvarPersonagem({ ...ficha, travado: travar || !!ficha.travado });
      setFicha({ ...ficha, id, travado: travar || !!ficha.travado });
      qc.invalidateQueries({ queryKey: ["personagens"] });
      toast.success(travar ? "Visual travado e salvo!" : "Personagem salvo!");
    } catch {
      toast.error("Não foi possível salvar.");
    }
    setSalvando(false);
  }

  async function enviar(files: FileList | null) {
    if (!files) return;
    const novas = await Promise.all([...files].map((f) => imagemParaTexto(f, 700)));
    set("imagens", [...(ficha?.imagens ?? []), ...novas]);
  }

  const bloqueado = !!ficha?.travado;

  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_440px]">
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-5xl">Banco de Personagens</h1>
              <p className="text-muted-foreground">Depois de travado, o visual de um personagem nunca muda.</p>
            </div>
            <button className="comic-btn" onClick={() => setFicha(vazio())}><Plus className="size-4" /> Novo</button>
          </div>
          {lista.length === 0 ? (
            <p className="mt-6 text-muted-foreground">Nenhum personagem ainda. Clique em “Novo”.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {lista.map((p) => (
                <button key={p.id} onClick={() => setFicha(p)} className="comic-card text-left">
                  <div className="aspect-square overflow-hidden border-b-2 bg-canvas">
                    {p.imagens[0] && <img src={p.imagens[0]} alt={p.nome} className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-2">
                    <p className="flex items-center gap-1 font-display text-xl">
                      {p.travado && <Lock className="size-3.5" />} {p.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.papel}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {ficha && (
          <aside className="comic-card h-fit space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl">Ficha do personagem</h2>
              <button aria-label="Fechar" onClick={() => setFicha(null)}><X /></button>
            </div>
            {bloqueado && (
              <p className="flex items-center gap-2 bg-highlight p-2 text-sm font-semibold"><Lock className="size-4" /> Visual travado</p>
            )}
            <Campo rotulo="Nome"><input className="comic-input" value={ficha.nome} onChange={(e) => set("nome", e.target.value)} /></Campo>
            <Campo rotulo="Descrição física detalhada">
              <textarea disabled={bloqueado} rows={4} className="comic-input" placeholder="Rosto, cabelo, olhos, altura, corpo, roupas, cores…"
                value={ficha.descricao} onChange={(e) => set("descricao", e.target.value)} />
            </Campo>
            <Campo rotulo="Estilo de roupa (roupa base)">
              <input disabled={bloqueado} className="comic-input" placeholder="Jaqueta de couro marrom, jeans, botas"
                value={ficha.roupa} onChange={(e) => set("roupa", e.target.value)} />
            </Campo>
            <Campo rotulo="Papel">
              <div className="flex flex-wrap gap-1.5">
                {PAPEIS.map((p) => (
                  <button key={p} onClick={() => set("papel", p)}
                    className={`comic-btn-light !px-2 !py-1 !text-xs ${ficha.papel === p ? "!bg-highlight" : ""}`}>{p}</button>
                ))}
              </div>
            </Campo>
            <Campo rotulo="Personalidade">
              <textarea rows={3} className="comic-input" value={ficha.personalidade} onChange={(e) => set("personalidade", e.target.value)} />
            </Campo>
            <Campo rotulo="Tags"><input className="comic-input" placeholder="herói, vilão…" value={ficha.tags} onChange={(e) => set("tags", e.target.value)} /></Campo>
            <Campo rotulo="Imagens de referência (rosto, corpo, roupas)">
              <div className="flex flex-wrap gap-2">
                {ficha.imagens?.map((src, i) => (
                  <div key={i} className="relative size-20 border-2">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    {!bloqueado && (
                      <button aria-label="Remover" className="absolute right-0 top-0 bg-card"
                        onClick={() => set("imagens", ficha.imagens!.filter((_, j) => j !== i))}><X className="size-3" /></button>
                    )}
                  </div>
                ))}
                {!bloqueado && (
                  <label className="flex size-20 cursor-pointer items-center justify-center border-2 border-dashed">
                    <Upload className="size-5" />
                    <input type="file" accept="image/*" multiple hidden onChange={(e) => enviar(e.target.files)} />
                  </label>
                )}
              </div>
            </Campo>
            <div className="flex flex-wrap gap-2">
              <button className="comic-btn-light" disabled={salvando} onClick={() => salvar(false)}><Save className="size-4" /> Salvar</button>
              {!bloqueado && (
                <button className="comic-btn !text-base" disabled={salvando} onClick={() => salvar(true)}><Lock className="size-4" /> Salvar e travar visual</button>
              )}
              {ficha.id && (
                <button aria-label="Apagar" className="comic-btn-light !bg-destructive !text-destructive-foreground"
                  onClick={async () => {
                    if (!confirm("Apagar personagem?")) return;
                    await apagarPersonagem(ficha.id!);
                    setFicha(null);
                    qc.invalidateQueries({ queryKey: ["personagens"] });
                  }}><Trash2 className="size-4" /></button>
              )}
            </div>
          </aside>
        )}
      </main>
    </>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return <div className="space-y-1 text-sm font-semibold">{rotulo}<div className="font-normal">{children}</div></div>;
}
