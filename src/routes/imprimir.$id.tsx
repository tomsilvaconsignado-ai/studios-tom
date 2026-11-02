import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Printer, Rows3 } from "lucide-react";
import { Grade } from "@/components/Grade";
import { CapaVisual } from "@/components/CapaVisual";
import { obterRevista, salvarRevista, type Revista } from "@/lib/db";
import { impor, ordemLeitura, paginasFaltando, rotulo, type ItemImpressao } from "@/lib/imposicao";

export const Route = createFileRoute("/imprimir/$id")({
  head: () => ({
    meta: [
      { title: "Preparar para impressão — Studios Tom" },
      { name: "description", content: "Imposição automática da revista em A4 paisagem, frente e verso, pronta para dobrar e montar." },
      { property: "og:title", content: "Preparar para impressão — Studios Tom" },
      { property: "og:description", content: "Revista imposta em A4 paisagem, pronta para imprimir e dobrar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: Imprimir,
});

const SANGRIA = 3; // mm
const SEGURANCA = 5; // mm dentro do corte

type Modo = "frente-verso" | "frente" | "verso";

function Imprimir() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: r, isLoading } = useQuery({ queryKey: ["revista-print", id], queryFn: () => obterRevista(id) });
  const [completar, setCompletar] = useState<boolean | null>(null);
  const [modo, setModo] = useState<Modo>("frente-verso");
  const [sangria, setSangria] = useState(true);
  const [marcas, setMarcas] = useState(false);
  const [guias, setGuias] = useState(true);
  const [vista, setVista] = useState<"folhas" | "dobra">("folhas");

  if (isLoading || !r) return <p className="p-10">Preparando impressão…</p>;
  const d = r.dados;
  const faltam = paginasFaltando(d.paginas.length);
  const precisaPerguntar = faltam > 0 && completar === null;
  const itens = ordemLeitura(d.paginas.map((p) => p.id), completar === true);
  const valido = itens.length % 4 === 0;
  const folhas = valido ? impor(itens.length) : [];

  const salvarVerso = async (campo: "versoCapa" | "versoContracapa", texto: string) => {
    const nova: Revista = { ...r, dados: { ...d, [campo]: { texto } } };
    qc.setQueryData(["revista-print", id], nova);
    await salvarRevista(nova);
  };

  const lado = (indices: [number, number], titulo: string, chave: string) => (
    <div key={chave} className="flex flex-col items-center gap-2 print:block">
      <p className="text-sm font-bold print:hidden">{titulo} · posições {indices[0] + 1} | {indices[1] + 1}</p>
      <section className="folha comic-card relative flex overflow-hidden bg-card" style={{ width: "297mm", height: "210mm" }}>
        {indices.map((ix, k) => (
          <Celula key={k} item={itens[ix]!} r={r} posicao={ix + 1} esquerda={k === 0}
            sangria={sangria} marcas={marcas} guias={guias} />
        ))}
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas print:bg-card">
      <style>{`@page { size: A4 landscape; margin: 0 } @media print { body { background: none } .folha { box-shadow: none !important; border: none !important; margin: 0 !important; break-after: page; page-break-after: always } }`}</style>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b-2 bg-highlight px-4 py-2 print:hidden">
        <Link to="/projeto/$id" params={{ id }} className="comic-btn-light !bg-card"><ArrowLeft className="size-4" /> Voltar ao editor</Link>
        <p className="text-sm font-semibold">{r.nome} · {itens.length} páginas · {folhas.length} folha(s) A4</p>
        <div className="ml-auto flex gap-2">
          <button className={`comic-btn-light ${vista === "folhas" ? "" : "!bg-card"}`} onClick={() => setVista("folhas")}><Rows3 className="size-4" /> Visualizar impressão</button>
          <button className={`comic-btn-light ${vista === "dobra" ? "" : "!bg-card"}`} onClick={() => setVista("dobra")} disabled={!valido}><BookOpen className="size-4" /> Simular dobra</button>
          <button className="comic-btn !py-1 !text-base" disabled={!valido} onClick={() => { setVista("folhas"); setTimeout(() => window.print(), 50); }}>
            <Printer className="size-4" /> Exportar PDF para impressão
          </button>
        </div>
      </div>

      {precisaPerguntar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 print:hidden">
          <div className="comic-card max-w-md space-y-4 bg-card p-6">
            <p className="font-semibold">Para impressão em formato de revista dobrada, a quantidade total de páginas precisa ser múltipla de 4. Deseja adicionar páginas em branco automaticamente?</p>
            <p className="text-sm text-muted-foreground">Serão adicionadas {faltam} página(s) em branco antes do verso da contracapa, sem alterar a numeração da revista.</p>
            <div className="flex justify-end gap-2">
              <button className="comic-btn-light !bg-card" onClick={() => setCompletar(false)}>Cancelar</button>
              <button className="comic-btn !py-1 !text-base" onClick={() => setCompletar(true)}>Adicionar páginas em branco</button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-5xl gap-4 p-4 text-sm md:grid-cols-2 print:hidden">
        <div className="comic-card space-y-2 bg-card p-3">
          <p className="font-bold">Configurações de impressão</p>
          <label className="flex items-center gap-2">Tipo de impressão:
            <select className="comic-input !w-auto !py-1" value={modo} onChange={(e) => setModo(e.target.value as Modo)}>
              <option value="frente-verso">Frente e verso</option>
              <option value="frente">Gerar PDF somente frente</option>
              <option value="verso">Gerar PDF somente verso</option>
            </select>
          </label>
          <p>Virada da folha: <b>Pelo lado curto</b> (escolha essa opção na impressora).</p>
          <label className="flex items-center gap-2"><input type="checkbox" checked={sangria} onChange={(e) => setSangria(e.target.checked)} /> Sangria de {SANGRIA} mm por lado</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={marcas} onChange={(e) => setMarcas(e.target.checked)} /> Incluir marcas de corte</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={guias} onChange={(e) => setGuias(e.target.checked)} /> Mostrar guias na tela (não imprimem)</label>
          {!valido && <p className="font-semibold text-destructive">Total de {itens.length} páginas não é múltiplo de 4. <button className="underline" onClick={() => setCompletar(true)}>Adicionar páginas em branco</button></p>}
          <p className="text-xs text-muted-foreground">Na janela de impressão escolha “Salvar como PDF”, margens “Nenhuma” e ative “Gráficos de plano de fundo”. Guias: <span className="text-primary">vermelho = corte</span>, azul tracejado = margem de segurança.</p>
        </div>
        <div className="comic-card space-y-2 bg-card p-3">
          <p className="font-bold">Páginas internas da folha externa</p>
          <label className="block">Verso da capa
            <textarea rows={2} className="comic-input" defaultValue={d.versoCapa?.texto ?? ""} placeholder="Expediente, apresentação, publicidade…" onBlur={(e) => salvarVerso("versoCapa", e.target.value)} />
          </label>
          <label className="block">Verso da contracapa
            <textarea rows={2} className="comic-input" defaultValue={d.versoContracapa?.texto ?? ""} placeholder="Publicidade, próximas edições…" onBlur={(e) => salvarVerso("versoContracapa", e.target.value)} />
          </label>
          <p className="text-xs text-muted-foreground">Ordem de leitura: {itens.map(rotulo).join(" → ")}</p>
        </div>
      </div>

      {vista === "folhas" && valido && (
        <div className="flex flex-col items-center gap-8 pb-10 print:block print:gap-0 print:p-0">
          {folhas.flatMap((f) => [
            modo !== "verso" ? lado(f.frente, `Folha ${String(f.numero).padStart(2, "0")} — Frente`, `${f.numero}f`) : null,
            modo !== "frente" ? lado(f.verso, `Folha ${String(f.numero).padStart(2, "0")} — Verso`, `${f.numero}v`) : null,
          ])}
        </div>
      )}
      {vista === "dobra" && valido && <SimularDobra itens={itens} r={r} />}
    </div>
  );
}

function Celula({ item, r, posicao, esquerda, sangria, marcas, guias }: {
  item: ItemImpressao; r: Revista; posicao: number; esquerda: boolean; sangria: boolean; marcas: boolean; guias: boolean;
}) {
  const b = sangria ? SANGRIA : 0;
  // Corte: recuo nas bordas externas (a borda da lombada é a dobra, sem sangria).
  const corte = { top: b, bottom: b, left: esquerda ? b : 0, right: esquerda ? 0 : b };
  const mm = (v: number) => `${v}mm`;
  return (
    <div className="relative h-full overflow-hidden" style={{ width: "148.5mm" }}>
      <ConteudoPagina item={item} r={r} />
      {guias && (
        <div className="pointer-events-none absolute inset-0 print:hidden">
          <div className="absolute border border-primary" style={{ top: mm(corte.top), bottom: mm(corte.bottom), left: mm(corte.left), right: mm(corte.right) }} />
          <div className="absolute border border-dashed border-ring" style={{ top: mm(corte.top + SEGURANCA), bottom: mm(corte.bottom + SEGURANCA), left: mm(corte.left + SEGURANCA), right: mm(corte.right + SEGURANCA) }} />
          <span className="absolute left-1/2 top-1 -translate-x-1/2 rounded border bg-card px-2 text-[10px] font-bold">pos. {posicao} · {rotulo(item)}</span>
        </div>
      )}
      {marcas && b > 0 && (
        <div className="pointer-events-none absolute inset-0">
          {[["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].map(([v, h]) => {
            const ext = (h === "left" && esquerda) || (h === "right" && !esquerda);
            if (!ext) return null;
            const vy = corte[v as "top" | "bottom"], hx = corte[h as "left" | "right"];
            return (
              <div key={v + h}>
                <div className="absolute bg-foreground" style={{ [v as string]: mm(vy), [h as string]: 0, width: mm(hx), height: "0.2mm" }} />
                <div className="absolute bg-foreground" style={{ [h as string]: mm(hx), [v as string]: 0, height: mm(vy), width: "0.2mm" }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConteudoPagina({ item, r }: { item: ItemImpressao; r: Revista }) {
  const d = r.dados;
  if (item.tipo === "capa") return <div className="absolute inset-0"><CapaVisual imagem={d.capa.imagem} titulo={d.capa.titulo} subtitulo={d.capa.subtitulo} camadas={d.capa.camadas} /></div>;
  if (item.tipo === "contracapa") return <div className="absolute inset-0 flex items-center justify-center bg-highlight p-[10mm] text-center font-display text-4xl">{d.contracapa.texto}</div>;
  if (item.tipo === "versoCapa" || item.tipo === "versoContracapa") {
    const texto = item.tipo === "versoCapa" ? d.versoCapa?.texto : d.versoContracapa?.texto;
    return <div className="absolute inset-0 flex items-center justify-center whitespace-pre-wrap bg-card p-[12mm] text-center text-lg">{texto}</div>;
  }
  if (item.tipo === "branco") return <div className="absolute inset-0 bg-card" />;
  const p = d.paginas.find((x) => x.id === item.paginaId);
  if (!p) return null;
  return (
    <div className="absolute inset-0 bg-card p-[8mm]">
      <Grade baloes={p.baloes ?? []} layout={p.layout} quadros={p.quadros} impressao />
      <span className="absolute bottom-[3.5mm] left-1/2 -translate-x-1/2 text-xs font-bold">{item.numero}</span>
    </div>
  );
}

function SimularDobra({ itens, r }: { itens: ItemImpressao[]; r: Revista }) {
  const n = itens.length;
  // Abertas: capa sozinha, depois pares (1,2), (3,4)... e contracapa sozinha.
  const abertas: (number | null)[][] = [[null, 0]];
  for (let i = 1; i < n - 1; i += 2) abertas.push([i, i + 1]);
  abertas.push([n - 1, null]);
  const [a, setA] = useState(0);
  const atual = abertas[a]!;
  const titulo = a === 0 ? "Revista fechada — frente" : a === abertas.length - 1 ? "Revista fechada — verso" : `Aberta ${a} de ${abertas.length - 2}`;
  return (
    <div className="flex flex-col items-center gap-4 pb-10 print:hidden">
      <p className="font-bold">{titulo}</p>
      <div className="flex items-center gap-4">
        <button className="comic-btn-light !bg-card" disabled={a === 0} onClick={() => setA(a - 1)} aria-label="Anterior"><ChevronLeft className="size-5" /></button>
        <div className="flex shadow-lg" style={{ height: "160mm" }}>
          {atual.map((ix, k) => (
            <div key={k} className="relative overflow-hidden" style={{ width: "113mm", height: "160mm", visibility: ix === null ? "hidden" : "visible" }}>
              {ix !== null && (
                <>
                  <div className="absolute left-0 top-0 origin-top-left" style={{ width: "148.5mm", height: "210mm", transform: "scale(0.7619)" }}>
                    <ConteudoPagina item={itens[ix]!} r={r} />
                  </div>
                  <div className={`pointer-events-none absolute inset-y-0 w-4 ${k === 0 ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r"} from-foreground/25 to-transparent`} />
                  <span className="absolute left-1 top-1 rounded border bg-card px-1 text-[10px] font-bold">{rotulo(itens[ix]!)}</span>
                </>
              )}
            </div>
          ))}
        </div>
        <button className="comic-btn-light !bg-card" disabled={a === abertas.length - 1} onClick={() => setA(a + 1)} aria-label="Próxima"><ChevronRight className="size-5" /></button>
      </div>
    </div>
  );
}
