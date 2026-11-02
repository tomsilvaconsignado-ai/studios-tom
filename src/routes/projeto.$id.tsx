import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Check, Copy, Expand, History, ImagePlus, Layers, Lock, Plus, Printer, Redo2, Save, Sparkles, Trash2, Type, Undo2, Unlock, X,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Grade } from "@/components/Grade";
import { CapaVisual } from "@/components/CapaVisual";
import { EditorBaloes } from "@/components/EditorBaloes";
import { EditorEnquadramento } from "@/components/EditorEnquadramento";
import { ContinuidadeQuadro } from "@/components/ContinuidadeQuadro";
import { ENQUADRAMENTO_ORIGINAL } from "@/lib/enquadramento";
import {
  criarVersao, duplicarRevista, ESTILOS, imagemCamadaParaTexto, imagemParaTexto, LAYOUTS, listarEstilosPersonalizados, listarPersonagens, listarVersoes, obterRevista, obterVersao,
  migrarBaloesParaPagina, quadrosPara, salvarRevista, uid, type CamadaCapa, type CamadaImagem, type DadosRevista, type EstiloPersonalizado, type Pagina, type Personagem, type Revista,
} from "@/lib/db";
import { compactar, gerarImagem, montarPrompt } from "@/lib/ia";

export const Route = createFileRoute("/projeto/$id")({
  head: () => ({
    meta: [
      { title: "Editor de revista — Studios Tom" },
      { name: "description", content: "Monte as páginas, quadros e balões da sua revista em quadrinhos." },
      { property: "og:title", content: "Editor de revista — Studios Tom" },
      { property: "og:description", content: "Monte as páginas, quadros e balões da sua revista." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: Editor,
});

type Sel = { tipo: "capa" } | { tipo: "contracapa" } | { tipo: "pagina"; id: string };
type Status = "salvo" | "pendente" | "salvando" | "erro";

function Editor() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: inicial, isLoading } = useQuery({ queryKey: ["revista", id], queryFn: () => obterRevista(id), staleTime: Infinity });
  const { data: personagens = [] } = useQuery({ queryKey: ["personagens"], queryFn: listarPersonagens });
  const { data: estilosPersonalizados = [] } = useQuery({ queryKey: ["estilos-personalizados"], queryFn: listarEstilosPersonalizados });
  const [rev, setRev] = useState<Revista | null>(null);
  const [sel, setSel] = useState<Sel>({ tipo: "capa" });
  const [quadroSel, setQuadroSel] = useState<number | null>(null);
  const [camadaSel, setCamadaSel] = useState<string | null>(null);
  const [ajustarImagem, setAjustarImagem] = useState(false);
  const [camadaCapaSel, setCamadaCapaSel] = useState<string | null>(null);
  const [capaCheia, setCapaCheia] = useState(false);
  const [status, setStatus] = useState<Status>("salvo");
  const [versoesAberto, setVersoesAberto] = useState(false);
  const revRef = useRef<Revista | null>(null);
  const passado = useRef<Revista[]>([]);
  const futuro = useRef<Revista[]>([]);
  const ultimoRegistro = useRef(0);
  const [, forcar] = useState(0);

  useEffect(() => {
    if (inicial && !rev) {
      setRev(inicial);
      revRef.current = inicial;
      if (inicial.dados.paginas[0]) setSel({ tipo: "pagina", id: inicial.dados.paginas[0].id });
    }
  }, [inicial, rev]);

  const salvar = useCallback(async (manual = false) => {
    if (!revRef.current) return;
    const snapshot = revRef.current;
    setStatus("salvando");
    try {
      await salvarRevista(snapshot);
      if (manual) {
        await criarVersao(snapshot);
        qc.invalidateQueries({ queryKey: ["versoes", snapshot.id] });
      }
      setStatus(revRef.current === snapshot ? "salvo" : "pendente");
      if (manual) toast.success("Projeto salvo! Uma versão foi guardada no histórico.");
    } catch {
      setStatus("erro");
      toast.error("Não foi possível salvar. Verifique sua internet e tente de novo.");
    }
  }, [qc]);

  const aplicar = useCallback((novo: Revista) => {
    revRef.current = novo;
    setRev(novo);
    setStatus("pendente");
  }, []);

  const desfazer = useCallback(() => {
    const ant = passado.current.pop();
    if (!ant || !revRef.current) return;
    futuro.current.push(revRef.current);
    ultimoRegistro.current = 0;
    aplicar(ant); forcar((n) => n + 1);
  }, [aplicar]);

  const refazer = useCallback(() => {
    const prox = futuro.current.pop();
    if (!prox || !revRef.current) return;
    passado.current.push(revRef.current);
    ultimoRegistro.current = 0;
    aplicar(prox); forcar((n) => n + 1);
  }, [aplicar]);

  // salvamento automático 2s após cada alteração
  useEffect(() => {
    if (status !== "pendente") return;
    const t = setTimeout(() => salvar(), 2000);
    return () => clearTimeout(t);
  }, [status, rev, salvar]);

  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => { if (status === "pendente" || status === "salvando") e.preventDefault(); };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [status]);

  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "s") { e.preventDefault(); salvar(true); }
      const digitando = (e.target as HTMLElement)?.closest("input, textarea");
      if (digitando) return;
      if (k === "z" && !e.shiftKey) { e.preventDefault(); desfazer(); }
      if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); refazer(); }
    };
    window.addEventListener("keydown", atalho);
    return () => window.removeEventListener("keydown", atalho);
  }, [salvar, desfazer, refazer]);

  if (isLoading || !rev) return <><Header /><p className="p-10">Carregando revista…</p></>;

  const d = rev.dados;
  const atualizar = (fn: (d: DadosRevista) => DadosRevista, extra?: Partial<Revista>) => {
    const agora = Date.now();
    // agrupa digitação contínua num único passo de "desfazer"
    if (agora - ultimoRegistro.current > 800) {
      passado.current.push(rev);
      if (passado.current.length > 100) passado.current.shift();
    }
    ultimoRegistro.current = agora;
    futuro.current = [];
    aplicar({ ...rev, ...extra, dados: fn(structuredClone(rev.dados)) });
  };
  // usa sempre o estado mais recente (para imagens que chegam depois)
  const atualizarAtual = (fn: (d: DadosRevista) => void) => {
    const atual = revRef.current!;
    passado.current.push(atual);
    futuro.current = [];
    ultimoRegistro.current = 0;
    const dd = structuredClone(atual.dados); fn(dd);
    aplicar({ ...atual, dados: dd });
  };
  const pagina = sel.tipo === "pagina" ? d.paginas.find((p) => p.id === sel.id) : undefined;
  const meuEstilo = estilosPersonalizados.find((e) => e.id === d.estiloPersonalizadoId);
  const mudarPagina = (fn: (p: Pagina) => void) =>
    atualizar((dd) => { const p = dd.paginas.find((x) => x.id === pagina!.id)!; migrarBaloesParaPagina(p); fn(p); return dd; });

  const novaPagina = (historiaId: string, depoisDe?: string) => {
    const nova: Pagina = { id: uid(), historiaId, layout: "6", quadros: quadrosPara("6"), personagens: [] };
    atualizar((dd) => {
      const i = depoisDe ? dd.paginas.findIndex((p) => p.id === depoisDe) + 1 : dd.paginas.length;
      dd.paginas.splice(i, 0, nova); return dd;
    });
    setSel({ tipo: "pagina", id: nova.id });
  };

  const restaurar = async (versaoId: string) => {
    if (!confirm("Restaurar esta versão? Você poderá desfazer depois.")) return;
    const v = await obterVersao(versaoId);
    passado.current.push(rev);
    futuro.current = [];
    const novo = { ...rev, nome: v.nome, estilo: v.estilo, formato: v.formato, dados: v.dados };
    aplicar(novo);
    const primeira = v.dados.paginas[0];
    setSel(primeira ? { tipo: "pagina", id: primeira.id } : { tipo: "capa" });
    setQuadroSel(null);
    setVersoesAberto(false);
    toast.success("Versão restaurada.");
  };

  const aspecto = rev.formato === "quadrado" ? "aspect-square" : rev.formato === "paisagem" ? "aspect-[297/210]" : "aspect-[210/297]";

  const statusTexto = { salvo: "✓ Salvo", pendente: "Alterações não salvas", salvando: "Salvando…", erro: "Erro ao salvar" }[status];
  const alterarCamadaCapa = (id: string, patch: Partial<CamadaCapa>) => atualizar((dd) => { const c = dd.capa.camadas?.find((x) => x.id === id); if (c) Object.assign(c, patch); return dd; });
  const anexarNaCapa = async (files: File[]) => {
    const validos = files.filter((f) => f.type === "image/png" || f.type === "image/jpeg");
    for (const file of validos) {
      const preparada = await imagemCamadaParaTexto(file);
      const proporcaoCapa = rev.formato === "quadrado" ? 1 : rev.formato === "paisagem" ? 297 / 210 : 210 / 297;
      const larguraInicial = Math.min(45, 82 * preparada.proporcao / proporcaoCapa);
      const camada: CamadaCapa = { id: uid(), tipo: "imagem", nome: file.name, imagem: preparada.imagem, x: 50, y: 50, largura: larguraInicial, proporcao: preparada.proporcao, rotacao: 0, opacidade: 100, bloqueada: false, ajuste: "conter", zoom: 1, enquadramentoX: 50, enquadramentoY: 50 };
      atualizarAtual((dd) => { dd.capa.camadas = [...(dd.capa.camadas ?? []), camada]; }); setCamadaCapaSel(camada.id);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <Header right={
        <>
          <Icone titulo="Desfazer (Ctrl+Z)" onClick={desfazer} desativado={passado.current.length === 0}><Undo2 className="size-4" /></Icone>
          <Icone titulo="Refazer (Ctrl+Y)" onClick={refazer} desativado={futuro.current.length === 0}><Redo2 className="size-4" /></Icone>
          <button className="comic-btn-light !bg-card" onClick={() => setVersoesAberto(true)}><History className="size-4" /> Versões</button>
          <Link to="/imprimir/$id" params={{ id: rev.id }} className="comic-btn-light !bg-card"
            onClick={() => { if (status !== "salvo") salvar(); }}>
            <Printer className="size-4" /> Preparar para impressão
          </Link>
          <span className={`text-xs font-semibold ${status === "salvo" ? "text-success" : status === "erro" ? "text-destructive" : "text-muted-foreground"}`}>
            {statusTexto}
          </span>
          <button className="comic-btn !py-1 !text-base" onClick={() => salvar(true)} disabled={status === "salvando"}>
            {status === "salvo" ? <Check className="size-4" /> : <Save className="size-4" />} Salvar projeto
          </button>
        </>
      } />
      {versoesAberto && (
        <PainelVersoes revistaId={rev.id} onFechar={() => setVersoesAberto(false)} onRestaurar={restaurar} />
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[210px_1fr_320px]">
        {/* Lista de páginas */}
        <aside className="space-y-3 overflow-y-auto border-r-2 bg-card p-3">
           <Miniatura ativo={sel.tipo === "capa"} rotulo="Capa" onClick={() => setSel({ tipo: "capa" })} aspecto={aspecto}>
             <CapaVisual imagem={d.capa.imagem} titulo={d.capa.titulo} subtitulo={d.capa.subtitulo} camadas={d.capa.camadas} />
          </Miniatura>
          {d.historias.map((h) => {
            const pags = d.paginas.filter((p) => p.historiaId === h.id);
            return (
              <div key={h.id} className="space-y-2">
                <p className="border-b-2 text-xs font-bold">☰ {h.titulo}</p>
                {pags.map((p) => {
                  const n = d.paginas.indexOf(p) + 1;
                  return (
                    <div key={p.id}>
                      <Miniatura ativo={sel.tipo === "pagina" && sel.id === p.id} rotulo={`Pág. ${n}`} aspecto={aspecto}
                        onClick={() => { setSel({ tipo: "pagina", id: p.id }); setQuadroSel(null); setCamadaSel(null); }}>
                        <Grade baloes={p.baloes ?? []} layout={p.layout} mini quadros={p.quadros} />
                      </Miniatura>
                    </div>
                  );
                })}
                <button className="comic-btn-light w-full" onClick={() => novaPagina(h.id, pags.at(-1)?.id)}>
                  <Plus className="size-3.5" /> Página
                </button>
              </div>
            );
          })}
          <button className="comic-btn-light w-full" onClick={() => {
            const h = { id: uid(), titulo: `História ${d.historias.length + 1}`, descricao: "" };
            atualizar((dd) => { dd.historias.push(h); return dd; });
            novaPagina(h.id);
          }}><Plus className="size-3.5" /> História</button>
          <Miniatura ativo={sel.tipo === "contracapa"} rotulo="Contracapa" onClick={() => setSel({ tipo: "contracapa" })} aspecto={aspecto}>
            <div className="flex h-full items-center justify-center bg-highlight p-1 text-center font-display text-[9px]">{d.contracapa.texto}</div>
          </Miniatura>
        </aside>

        {/* Página */}
        <main className="flex items-start justify-center overflow-auto bg-canvas p-8">
          <div className={`comic-card w-full max-w-[600px] ${aspecto} p-4`}>
            {sel.tipo === "capa" && (
              <CapaVisual imagem={d.capa.imagem} titulo={d.capa.titulo} subtitulo={d.capa.subtitulo} camadas={d.capa.camadas} selecionada={camadaCapaSel} editar onSelecionar={setCamadaCapaSel} onAlterar={alterarCamadaCapa} onSoltarArquivos={anexarNaCapa} />
            )}
            {sel.tipo === "contracapa" && (
              <div className="flex h-full items-center justify-center bg-highlight text-center font-display text-4xl">{d.contracapa.texto}</div>
            )}
            {pagina && (
              <Grade baloes={pagina.baloes ?? []} layout={pagina.layout} quadros={pagina.quadros} selecionado={quadroSel}
                onSelect={(i) => { setQuadroSel(i); setCamadaSel(null); }}
                ajustarImagem={ajustarImagem}
                onEnquadramento={(i, v) => mudarPagina((p) => { const quadro = p.quadros[i]; if (quadro) quadro.enquadramento = v; })}
                camadaSelecionada={camadaSel}
                onSelecionarCamada={setCamadaSel}
                onAlterarCamada={(camadaId, patch) => mudarPagina((p) => {
                  const camada = [...(p.baloes ?? []), ...p.quadros.flatMap((q) => q.camadas ?? [])].find((item) => item.id === camadaId);
                  if (camada) Object.assign(camada, patch);
                })}
              />
            )}
          </div>
        </main>

        {/* Configurações */}
        <aside className="space-y-5 overflow-y-auto border-l-2 bg-card p-4">
          {sel.tipo === "capa" && (
            <>
              <h2 className="text-3xl">Capa</h2>
              <Campo rotulo="Nome da revista">
                <input className="comic-input" value={rev.nome} onChange={(e) => atualizar((dd) => { dd.capa.titulo = e.target.value; return dd; }, { nome: e.target.value })} />
              </Campo>
              <Campo rotulo="Subtítulo">
                <input className="comic-input" value={d.capa.subtitulo} onChange={(e) => atualizar((dd) => { dd.capa.subtitulo = e.target.value; return dd; })} />
              </Campo>
              <Campo rotulo="Estilo de arte global">
                <select className="comic-input" value={rev.estilo} onChange={(e) => atualizar((dd) => dd, { estilo: e.target.value })}>
                  {ESTILOS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Campo>
              <Campo rotulo="Meu Estilo (prioridade sobre o estilo global)">
                <select className="comic-input" value={d.estiloPersonalizadoId ?? ""} onChange={(e) => atualizar((dd) => { if (e.target.value) dd.estiloPersonalizadoId = e.target.value; else delete dd.estiloPersonalizadoId; return dd; })}>
                  <option value="">Nenhum</option>{estilosPersonalizados.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </Campo>
              <Campo rotulo="Descrição da capa (para a IA)">
                <textarea rows={3} className="comic-input" placeholder="O herói em pose heroica no topo de um prédio, à noite…"
                  value={d.capa.cena ?? ""} onChange={(e) => atualizar((dd) => { dd.capa.cena = e.target.value; return dd; })} />
              </Campo>
              <GerarIA
                rotulo="Gerar capa com IA"
                 prompt={() => montarPrompt({ tipo: "capa", titulo: rev.nome, estilo: rev.estilo, ...(meuEstilo ? { estiloPersonalizado: meuEstilo.prompt_estilo } : {}), cena: d.capa.cena || d.capa.subtitulo || rev.nome, personagens })}
                personagens={personagens.filter((p) => p.papel === "Herói" || p.papel === "Vilão").slice(0, 3)}
                 referenciasEstilo={meuEstilo?.imagens ?? []}
                onPronto={(img) => atualizarAtual((dd) => { dd.capa.imagem = img; })}
              />
              <EnviarImagem rotulo="Imagem da capa" valor={d.capa.imagem}
                onChange={(img) => atualizar((dd) => { dd.capa.imagem = img; return dd; })} />
              <EditorCapa camadas={d.capa.camadas ?? []} selecionada={camadaCapaSel} onSelecionar={setCamadaCapaSel} onAdicionarTexto={() => { const c: CamadaCapa = { id: uid(), tipo: "texto", nome: "Novo texto", texto: "NOVO TEXTO", x: 50, y: 20, largura: 70, proporcao: 5, rotacao: 0, opacidade: 100, bloqueada: false, tamanhoFonte: 36 }; atualizar((dd) => { dd.capa.camadas = [...(dd.capa.camadas ?? []), c]; return dd; }); setCamadaCapaSel(c.id); }} onAnexar={anexarNaCapa} onAlterar={alterarCamadaCapa} onMover={(id, dir) => atualizar((dd) => { const cs = dd.capa.camadas ?? []; const i = cs.findIndex((c) => c.id === id), j = i + dir; if (i >= 0 && j >= 0 && j < cs.length) [cs[i], cs[j]] = [cs[j]!, cs[i]!]; return dd; })} onDuplicar={(id) => atualizar((dd) => { const c = dd.capa.camadas?.find((x) => x.id === id); if (c) { const copia = { ...structuredClone(c), id: uid(), nome: `${c.nome} cópia`, x: Math.min(100, c.x + 3), y: Math.min(100, c.y + 3) }; dd.capa.camadas?.push(copia); setCamadaCapaSel(copia.id); } return dd; })} onExcluir={(id) => { atualizar((dd) => { dd.capa.camadas = (dd.capa.camadas ?? []).filter((c) => c.id !== id); return dd; }); setCamadaCapaSel(null); }} />
              <div className="grid grid-cols-2 gap-2"><button className="comic-btn-light" onClick={() => setCapaCheia(true)}><Expand className="size-4" />Tela cheia</button><button className="comic-btn-light" onClick={async () => { const novo = await duplicarRevista(rev); window.location.href = `/projeto/${novo}`; }}><Copy className="size-4" />Nova edição</button></div>
              <Campo rotulo="Modelos de capa">
                <div className="flex gap-2"><button className="comic-btn-light" onClick={() => { const nome = prompt("Nome do modelo", `Modelo ${(d.capa.modelos?.length ?? 0) + 1}`)?.trim(); if (!nome) return; atualizar((dd) => { dd.capa.modelos = [...(dd.capa.modelos ?? []), { id: uid(), nome, ...(dd.capa.imagem ? { imagem: dd.capa.imagem } : {}), camadas: structuredClone(dd.capa.camadas ?? []) }]; return dd; }); }}>Salvar modelo</button>{d.capa.modelos?.map((m) => <button key={m.id} className="comic-btn-light" onClick={() => atualizar((dd) => { if (m.imagem) dd.capa.imagem = m.imagem; else delete dd.capa.imagem; dd.capa.camadas = structuredClone(m.camadas); return dd; })}>{m.nome}</button>)}</div>
              </Campo>
            </>
          )}
          {sel.tipo === "contracapa" && (
            <>
              <h2 className="text-3xl">Contracapa</h2>
              <Campo rotulo="Texto">
                <textarea rows={4} className="comic-input" value={d.contracapa.texto}
                  onChange={(e) => atualizar((dd) => { dd.contracapa.texto = e.target.value; return dd; })} />
              </Campo>
            </>
          )}
          {pagina && (() => {
            const h = d.historias.find((x) => x.id === pagina.historiaId)!;
            const n = d.paginas.indexOf(pagina) + 1;
            const q = quadroSel !== null ? pagina.quadros[quadroSel] ?? null : null;
            return (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl">Página {n}</h2>
                  <div className="flex gap-1">
                    <Icone titulo="Subir" onClick={() => atualizar((dd) => { const i = dd.paginas.findIndex((p) => p.id === pagina.id); if (i > 0) dd.paginas.splice(i - 1, 2, dd.paginas[i]!, dd.paginas[i - 1]!); return dd; })}><ArrowUp className="size-4" /></Icone>
                    <Icone titulo="Descer" onClick={() => atualizar((dd) => { const i = dd.paginas.findIndex((p) => p.id === pagina.id); if (i < dd.paginas.length - 1) dd.paginas.splice(i, 2, dd.paginas[i + 1]!, dd.paginas[i]!); return dd; })}><ArrowDown className="size-4" /></Icone>
                    <Icone titulo="Duplicar" onClick={() => {
                      const copia = { ...structuredClone(pagina), id: uid() };
                      atualizar((dd) => { dd.paginas.splice(dd.paginas.findIndex((p) => p.id === pagina.id) + 1, 0, copia); return dd; });
                      setSel({ tipo: "pagina", id: copia.id });
                    }}><Copy className="size-4" /></Icone>
                    <Icone titulo="Apagar página" onClick={() => {
                      if (d.paginas.length <= 1) { toast.error("A revista precisa de pelo menos uma página."); return; }
                      if (!confirm("Apagar esta página?")) return;
                      const resto = d.paginas.filter((p) => p.id !== pagina.id);
                      atualizar((dd) => { dd.paginas = dd.paginas.filter((p) => p.id !== pagina.id); return dd; });
                      setSel({ tipo: "pagina", id: resto[0]!.id });
                    }}><Trash2 className="size-4" /></Icone>
                  </div>
                </div>

                {q && quadroSel !== null && (
                  <div className="space-y-3 border-2 bg-secondary p-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl">Quadro {quadroSel + 1}</h3>
                      <button aria-label="Fechar" onClick={() => setQuadroSel(null)}><X className="size-4" /></button>
                    </div>
                    <Campo rotulo="Descrição da cena">
                      <textarea rows={3} className="comic-input" value={q.texto}
                        onChange={(e) => mudarPagina((p) => { p.quadros[quadroSel]!.texto = e.target.value; })} />
                    </Campo>
                    <Campo rotulo="Balão de fala">
                      <input className="comic-input" value={q.balao}
                        onChange={(e) => mudarPagina((p) => { p.quadros[quadroSel]!.balao = e.target.value; })} />
                    </Campo>
                    <ContinuidadeQuadro key={`c-${q.id}`} dados={d} paginaId={pagina.id} quadro={q}
                      personagens={personagens.filter((c) => pagina.personagens.includes(c.id))}
                      promptBase={() => montarPrompt({
                        tipo: "quadro", estilo: rev.estilo, ...(meuEstilo ? { estiloPersonalizado: meuEstilo.prompt_estilo } : {}),
                        cena: [h.descricao && `Contexto da história: ${h.descricao}`, q.texto || "Cena de ação"].filter(Boolean).join(". "),
                        personagens: personagens.filter((c) => pagina.personagens.includes(c.id)),
                      })}
                      onConfig={(c) => atualizar((dd) => { dd.continuidade = c; return dd; })}
                      onMudancas={(m) => { if (!m.length) return; const pid = pagina.id, qid = q.id; atualizarAtual((dd) => { const a = dd.paginas.find((x) => x.id === pid)?.quadros.find((x) => x.id === qid); if (a) a.mudancas = [...new Set([...(a.mudancas ?? []), ...m])]; }); }}
                      onContexto={(ctx) => { const pid = pagina.id, qid = q.id; atualizarAtual((dd) => { const a = dd.paginas.find((x) => x.id === pid)?.quadros.find((x) => x.id === qid); if (a) a.contexto = ctx; }); }}>
                    {({ preparar, aposGerar }) => (
                    <GerarIA
                      key={q.id}
                      rotulo="Gerar quadro com IA"
                      proporcao={() => {
                        const painel = document.querySelector(`main [data-quadro="${quadroSel}"]`);
                        return painel ? painel.clientWidth / painel.clientHeight : 1;
                      }}
                      preparar={preparar}
                      prompt={() => montarPrompt({
                        tipo: "quadro", estilo: rev.estilo, ...(meuEstilo ? { estiloPersonalizado: meuEstilo.prompt_estilo } : {}),
                        cena: [h.descricao && `Contexto da história: ${h.descricao}`, q.texto || "Cena de ação"].filter(Boolean).join(". "),
                        personagens: personagens.filter((c) => pagina.personagens.includes(c.id)),
                      })}
                      personagens={personagens.filter((c) => pagina.personagens.includes(c.id))}
                      referenciasEstilo={meuEstilo?.imagens ?? []}
                      onPronto={(img) => {
                        const pid = pagina.id, qid = q.id;
                        atualizarAtual((dd) => {
                          const alvo = dd.paginas.find((x) => x.id === pid)?.quadros.find((x) => x.id === qid);
                          if (alvo) { alvo.imagem = img; alvo.enquadramento = { ...ENQUADRAMENTO_ORIGINAL }; }
                        });
                        aposGerar(img);
                      }}
                    />
                    )}
                    </ContinuidadeQuadro>
                    <EnviarImagem rotulo="Imagem do quadro" valor={q.imagem}
                      onChange={(img) => mudarPagina((p) => { const quadro = p.quadros[quadroSel]; if (quadro) { quadro.imagem = img; quadro.enquadramento = { ...ENQUADRAMENTO_ORIGINAL }; } })} />
                    {q.imagem && <EditorEnquadramento {...(q.enquadramento ? { valor: q.enquadramento } : {})} ativo={ajustarImagem}
                      onAtivo={(v) => { setAjustarImagem(v); setCamadaSel(null); }}
                      onAlterar={(v) => mudarPagina((p) => { const quadro = p.quadros[quadroSel]; if (quadro) quadro.enquadramento = v; })} />}
                    
                    <EditorCamadas
                      camadas={q.camadas ?? []}
                      selecionada={camadaSel}
                      onSelecionar={setCamadaSel}
                      onAdicionar={(camada) => mudarPagina((p) => {
                        const quadro = p.quadros[quadroSel];
                        if (!quadro) return;
                        quadro.camadas = [...(quadro.camadas ?? []), camada];
                      })}
                      onAlterar={(id, patch) => mudarPagina((p) => {
                        const camada = p.quadros[quadroSel]?.camadas?.find((item) => item.id === id);
                        if (camada) Object.assign(camada, patch);
                      })}
                      onMover={(id, direcao) => mudarPagina((p) => {
                        const camadas = p.quadros[quadroSel]?.camadas;
                        if (!camadas) return;
                        const i = camadas.findIndex((item) => item.id === id);
                        const destino = i + direcao;
                        if (i < 0 || destino < 0 || destino >= camadas.length) return;
                        [camadas[i], camadas[destino]] = [camadas[destino]!, camadas[i]!];
                      })}
                      onExcluir={(id) => {
                        mudarPagina((p) => {
                          const quadro = p.quadros[quadroSel];
                          if (quadro) quadro.camadas = (quadro.camadas ?? []).filter((item) => item.id !== id);
                        });
                        setCamadaSel(null);
                      }}
                    />
                  </div>
                )}

                <EditorBaloes camadas={pagina.baloes ?? []} selecionada={camadaSel} modelos={d.modelosBaloes ?? []}
                  onSelecionar={setCamadaSel}
                  onAdicionar={(camada) => mudarPagina((p) => { p.baloes = [...(p.baloes ?? []), camada]; })}
                  onAlterar={(id, patch) => mudarPagina((p) => { const camada = p.baloes?.find((c) => c.id === id); if (camada) Object.assign(camada, patch); })}
                  onMover={(id, direcao) => mudarPagina((p) => { const cs = p.baloes; if (!cs) return; const i = cs.findIndex((c) => c.id === id), j = i + direcao; const a = cs[i], b = cs[j]; if (a && b) { cs[i] = b; cs[j] = a; } })}
                  onExcluir={(id) => { mudarPagina((p) => { p.baloes = (p.baloes ?? []).filter((c) => c.id !== id); }); setCamadaSel(null); }}
                  onModelos={(modelos) => atualizar((dd) => { dd.modelosBaloes = modelos; return dd; })}
                />

                <h3 className="text-2xl">{h.titulo}</h3>
                <Campo rotulo="Título da história">
                  <input className="comic-input" value={h.titulo}
                    onChange={(e) => atualizar((dd) => { dd.historias.find((x) => x.id === h.id)!.titulo = e.target.value; return dd; })} />
                </Campo>
                <Campo rotulo="Descrição">
                  <textarea rows={3} className="comic-input" value={h.descricao}
                    onChange={(e) => atualizar((dd) => { dd.historias.find((x) => x.id === h.id)!.descricao = e.target.value; return dd; })} />
                </Campo>
                <Campo rotulo="Personagens na cena">
                  {personagens.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum personagem. <a href="/personagens" className="underline">Criar no Banco</a></p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {personagens.map((c) => {
                        const on = pagina.personagens.includes(c.id);
                        return (
                          <button key={c.id} className={`comic-btn-light !px-2 !py-1 !text-xs ${on ? "!bg-highlight" : ""}`}
                            onClick={() => mudarPagina((p) => { p.personagens = on ? p.personagens.filter((x) => x !== c.id) : [...p.personagens, c.id]; })}>
                            {c.nome}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Campo>
                <Campo rotulo="Layout desta página">
                  <div className="grid grid-cols-3 gap-2">
                    {LAYOUTS.map((l) => (
                      <button key={l.id} title={l.nome}
                        onClick={() => { mudarPagina((p) => { p.layout = l.id; p.quadros = quadrosPara(l.id, p.quadros); }); setQuadroSel(null); }}
                        className={`border-2 p-1 text-[10px] ${pagina.layout === l.id ? "bg-highlight" : "bg-card"}`}>
                        <div className="aspect-[3/4]"><Grade layout={l.id} mini /></div>
                        <span className="mt-1 block leading-tight">{l.nome}</span>
                      </button>
                    ))}
                  </div>
                </Campo>
                <p className="text-xs text-muted-foreground">Clique num quadro para escrever a cena, o balão ou enviar uma imagem.</p>
              </>
            );
          })()}
        </aside>
      </div>
      {capaCheia && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 p-8"><button aria-label="Fechar tela cheia" className="absolute right-5 top-5 border-2 bg-card p-2" onClick={() => setCapaCheia(false)}><X /></button><div className={`h-[90vh] ${aspecto} max-w-[90vw] border-2 bg-card`}><CapaVisual imagem={d.capa.imagem} titulo={d.capa.titulo} subtitulo={d.capa.subtitulo} camadas={d.capa.camadas} /></div></div>}
    </div>
  );
}

function Miniatura({ ativo, rotulo, onClick, aspecto, children }: {
  ativo: boolean; rotulo: string; onClick: () => void; aspecto: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} className="block w-full text-left">
      <div className={`${aspecto} overflow-hidden border-2 bg-card p-1 ${ativo ? "outline outline-4 outline-ring" : ""}`}>{children}</div>
      <span className="text-xs font-bold">{rotulo}</span>
    </button>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return <div className="space-y-1 text-sm font-semibold">{rotulo}<div className="font-normal">{children}</div></div>;
}

function Icone({ titulo, onClick, children, desativado }: { titulo: string; onClick: () => void; children: React.ReactNode; desativado?: boolean }) {
  return <button title={titulo} aria-label={titulo} onClick={onClick} disabled={desativado}
    className="border-2 bg-card p-1 hover:bg-highlight disabled:opacity-40">{children}</button>;
}

function GerarIA({ rotulo, prompt, personagens, referenciasEstilo = [], onPronto, proporcao, preparar }: {
  rotulo: string; prompt: () => string; personagens: Personagem[]; referenciasEstilo?: string[]; onPronto: (img: string) => void; proporcao?: () => number;
  preparar?: () => Promise<{ prompt: string; refs: string[] } | null>;
}) {
  const [previa, setPrevia] = useState<string | null>(null);
  const [final, setFinal] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function gerar() {
    setGerando(true); setErro(null); setPrevia(null); setFinal(false);
    let ultima = "";
    try {
      const prep = preparar ? await preparar() : { prompt: prompt(), refs: [] };
      if (!prep) { setGerando(false); return; }
      await gerarImagem(prep.prompt, personagens, (src, fim) => { ultima = src; setPrevia(src); setFinal(fim); }, referenciasEstilo, proporcao?.(), prep.refs);
      onPronto(await compactar(ultima));
      toast.success("Imagem criada!");
      setPrevia(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setErro(msg || "Não foi possível criar a imagem.");
    }
    setGerando(false);
  }

  return (
    <div className="space-y-2">
      <button className="comic-btn w-full justify-center !text-base" onClick={gerar} disabled={gerando}>
        <Sparkles className="size-4" /> {gerando ? "Criando imagem…" : rotulo}
      </button>
      {personagens.length > 0 && (
        <p className="text-xs text-muted-foreground">Usando o visual de: {personagens.map((p) => p.nome).join(", ")}</p>
      )}
      {previa && (
        <img src={previa} alt="Prévia" className={`w-full border-2 transition-[filter] ${final ? "blur-0" : "blur-2xl"}`} />
      )}
      {erro && <p className="text-xs font-semibold text-destructive">{erro}</p>}
    </div>
  );
}

function PainelVersoes({ revistaId, onFechar, onRestaurar }: {
  revistaId: string; onFechar: () => void; onRestaurar: (id: string) => void;
}) {
  const { data: versoes = [], isLoading } = useQuery({ queryKey: ["versoes", revistaId], queryFn: () => listarVersoes(revistaId) });
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40" onClick={onFechar}>
      <div className="comic-card h-full w-full max-w-sm space-y-3 overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl">Versões</h2>
          <button aria-label="Fechar" onClick={onFechar}><X /></button>
        </div>
        <p className="text-sm text-muted-foreground">Cada vez que você clica em “Salvar projeto”, uma versão é guardada aqui.</p>
        {isLoading ? <p>Carregando…</p> : versoes.length === 0 ? (
          <p className="text-sm">Nenhuma versão ainda.</p>
        ) : versoes.map((v, i) => (
          <div key={v.id} className="flex items-center justify-between gap-2 border-2 bg-secondary p-3">
            <div>
              <p className="font-semibold">{new Date(v.created_at).toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">{v.nome}{i === 0 ? " · mais recente" : ""}</p>
            </div>
            <button className="comic-btn-light !bg-card" onClick={() => onRestaurar(v.id)}>Restaurar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnviarImagem({ rotulo, valor, onChange }: { rotulo: string; valor: string | undefined; onChange: (v: string | undefined) => void }) {
  return (
    <Campo rotulo={rotulo}>
      <div className="flex items-center gap-2">
        {valor && <img src={valor} alt="" className="size-16 border-2 object-cover" />}
        <label className="comic-btn-light cursor-pointer">
          <ImagePlus className="size-4" /> {valor ? "Trocar" : "Enviar"}
          <input type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) onChange(await imagemParaTexto(f));
          }} />
        </label>
        {valor && <button className="comic-btn-light" onClick={() => onChange(undefined)}>Remover</button>}
      </div>
    </Campo>
  );
}

function EditorCapa({ camadas, selecionada, onSelecionar, onAdicionarTexto, onAnexar, onAlterar, onMover, onDuplicar, onExcluir }: {
  camadas: CamadaCapa[]; selecionada: string | null; onSelecionar: (id: string | null) => void; onAdicionarTexto: () => void;
  onAnexar: (files: File[]) => void; onAlterar: (id: string, patch: Partial<CamadaCapa>) => void; onMover: (id: string, dir: -1 | 1) => void;
  onDuplicar: (id: string) => void; onExcluir: (id: string) => void;
}) {
  const ativa = camadas.find((c) => c.id === selecionada);
  const numero = (nome: string, campo: "x" | "y" | "largura" | "rotacao", min: number, max: number) => <label className="text-xs font-semibold">{nome}<input aria-label={nome} type="number" className="comic-input !py-1" min={min} max={max} value={ativa?.[campo] ?? 0} onChange={(e) => ativa && onAlterar(ativa.id, { [campo]: Math.min(max, Math.max(min, Number(e.target.value))) })} /></label>;
  return <div className="space-y-3 border-t-2 pt-3"><div className="flex flex-wrap gap-2"><label className="comic-btn-light cursor-pointer"><ImagePlus className="size-4" />Imagem / logo<input hidden multiple type="file" accept="image/jpeg,image/png" onChange={(e) => { onAnexar([...(e.target.files ?? [])]); e.currentTarget.value = ""; }} /></label><button className="comic-btn-light" onClick={onAdicionarTexto}><Type className="size-4" />Texto / SFX</button></div>
    <div className="space-y-1">{[...camadas].reverse().map((c) => <button key={c.id} className={`flex w-full items-center gap-2 border-2 p-2 text-left text-xs ${c.id === selecionada ? "bg-highlight" : "bg-card"}`} onClick={() => onSelecionar(c.id)}>{c.tipo === "imagem" && c.imagem ? <img src={c.imagem} alt="" className="size-8 object-contain" /> : <Type className="size-5" />}<span className="min-w-0 flex-1 truncate font-semibold">{c.nome}</span>{c.bloqueada && <Lock className="size-3.5" />}</button>)}</div>
    {ativa && <div className="space-y-3 border-2 bg-secondary p-3">{ativa.tipo === "texto" && <><label className="text-xs font-semibold">Texto<textarea className="comic-input" value={ativa.texto ?? ""} onChange={(e) => onAlterar(ativa.id, { texto: e.target.value, nome: e.target.value.slice(0, 24) || "Texto" })} /></label><label className="text-xs font-semibold">Tamanho da letra<input type="range" min="12" max="120" value={ativa.tamanhoFonte ?? 36} className="w-full accent-primary" onChange={(e) => onAlterar(ativa.id, { tamanhoFonte: Number(e.target.value) })} /></label></>}
      <div className="grid grid-cols-2 gap-2">{numero("Posição X", "x", 0, 100)}{numero("Posição Y", "y", 0, 100)}{numero("Tamanho", "largura", 5, 180)}{numero("Rotação", "rotacao", -360, 360)}</div>
      <label className="block text-xs font-semibold">Opacidade: {ativa.opacidade}%<input type="range" min="0" max="100" value={ativa.opacidade} className="w-full accent-primary" onChange={(e) => onAlterar(ativa.id, { opacidade: Number(e.target.value) })} /></label>
      {ativa.tipo === "imagem" && <div className="space-y-2 border-t pt-2"><div className="grid grid-cols-2 gap-2"><button className={`comic-btn-light ${ativa.ajuste !== "recortar" ? "!bg-highlight" : ""}`} onClick={() => onAlterar(ativa.id, { ajuste: "conter", zoom: 1, enquadramentoX: 50, enquadramentoY: 50 })}>Imagem completa</button><button className={`comic-btn-light ${ativa.ajuste === "recortar" ? "!bg-highlight" : ""}`} onClick={() => onAlterar(ativa.id, { ajuste: "recortar" })}>Recortar</button></div>{ativa.ajuste === "recortar" && <><label className="block text-xs font-semibold">Recorte / zoom: {Math.round((ativa.zoom ?? 1) * 100)}%<input type="range" min="1" max="3" step="0.05" value={ativa.zoom ?? 1} className="w-full accent-primary" onChange={(e) => onAlterar(ativa.id, { zoom: Number(e.target.value) })} /></label><div className="grid grid-cols-2 gap-2">{(["enquadramentoX", "enquadramentoY"] as const).map((campo, i) => <label key={campo} className="text-xs font-semibold">Enquadrar {i ? "Y" : "X"}<input type="range" min="0" max="100" value={ativa[campo] ?? 50} className="w-full accent-primary" onChange={(e) => onAlterar(ativa.id, { [campo]: Number(e.target.value) })} /></label>)}</div></>}</div>}
      <div className="grid grid-cols-3 gap-2"><button className="comic-btn-light" onClick={() => onMover(ativa.id, 1)}><ArrowUp className="size-4" /></button><button className="comic-btn-light" onClick={() => onMover(ativa.id, -1)}><ArrowDown className="size-4" /></button><button className="comic-btn-light" onClick={() => onAlterar(ativa.id, { bloqueada: !ativa.bloqueada })}>{ativa.bloqueada ? <Unlock className="size-4" /> : <Lock className="size-4" />}</button><button className="comic-btn-light" onClick={() => onDuplicar(ativa.id)}><Copy className="size-4" /></button><button className="comic-btn-light col-span-2" onClick={() => onExcluir(ativa.id)}><Trash2 className="size-4" />Excluir</button></div>
    </div>}
  </div>;
}

function EditorCamadas({ camadas, selecionada, onSelecionar, onAdicionar, onAlterar, onMover, onExcluir }: {
  camadas: CamadaImagem[];
  selecionada: string | null;
  onSelecionar: (id: string | null) => void;
  onAdicionar: (camada: CamadaImagem) => void;
  onAlterar: (id: string, patch: Partial<CamadaImagem>) => void;
  onMover: (id: string, direcao: -1 | 1) => void;
  onExcluir: (id: string) => void;
}) {
  const ativa = camadas.find((camada) => camada.id === selecionada && !camada.balao) ?? null;

  const carregar = async (file: File, substituir?: CamadaImagem) => {
    try {
      const preparada = await imagemCamadaParaTexto(file);
      if (substituir) {
        onAlterar(substituir.id, { imagem: preparada.imagem, proporcao: preparada.proporcao, nome: file.name });
      } else {
        const camada: CamadaImagem = {
          id: uid(), imagem: preparada.imagem, nome: file.name, x: 50, y: 50,
          largura: 42, proporcao: preparada.proporcao, rotacao: 0, opacidade: 100,
        };
        onAdicionar(camada); onSelecionar(camada.id);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível anexar a imagem.");
    }
  };

  const numero = (rotulo: string, campo: "x" | "y" | "largura" | "rotacao" | "opacidade", min: number, max: number, sufixo: string) => (
    <label className="space-y-1 text-xs font-semibold">
      <span>{rotulo}</span>
      <div className="relative">
        <input type="number" min={min} max={max} step={1} className="comic-input !py-1 !pr-7"
          value={ativa?.[campo] ?? 0}
          onChange={(e) => ativa && onAlterar(ativa.id, { [campo]: Math.min(max, Math.max(min, Number(e.target.value))) })} />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">{sufixo}</span>
      </div>
    </label>
  );

  return (
    <div className="space-y-3 border-t-2 pt-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 font-bold"><Layers className="size-4" /> Camadas sobrepostas</h4>
        <label className="comic-btn-light cursor-pointer !px-2 !py-1">
          <ImagePlus className="size-4" /> Anexar JPG/PNG
          <input type="file" accept="image/jpeg,image/png" hidden onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await carregar(file);
            e.currentTarget.value = "";
          }} />
        </label>
      </div>
      {camadas.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma camada neste quadro.</p>
      ) : (
        <div className="space-y-1">
          {[...camadas].reverse().map((camada) => (
            <button key={camada.id} type="button" onClick={() => onSelecionar(camada.id)}
              className={`flex w-full items-center gap-2 border-2 p-1.5 text-left text-xs ${selecionada === camada.id ? "bg-highlight" : "bg-card"}`}>
              {camada.balao ? <Type className="size-5" /> : <img src={camada.imagem} alt="" className="size-8 object-contain" />}
              <span className="min-w-0 flex-1 truncate font-semibold">{camada.nome}</span>
            </button>
          ))}
        </div>
      )}
      {ativa && (
        <div className="space-y-3 border-2 bg-secondary p-3">
          <div className="grid grid-cols-2 gap-2">
            {numero("Posição X", "x", 0, 100, "%")}
            {numero("Posição Y", "y", 0, 100, "%")}
            {numero("Tamanho", "largura", 5, 180, "%")}
            {numero("Rotação", "rotacao", -360, 360, "°")}
          </div>
          <label className="block space-y-1 text-xs font-semibold">
            <span>Opacidade: {ativa.opacidade}%</span>
            <input type="range" min={0} max={100} value={ativa.opacidade} className="w-full accent-primary"
              onChange={(e) => onAlterar(ativa.id, { opacidade: Number(e.target.value) })} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="comic-btn-light" disabled={camadas.at(-1)?.id === ativa.id} onClick={() => onMover(ativa.id, 1)}><ArrowUp className="size-4" /> Para frente</button>
            <button type="button" className="comic-btn-light" disabled={camadas[0]?.id === ativa.id} onClick={() => onMover(ativa.id, -1)}><ArrowDown className="size-4" /> Para trás</button>
            <label className="comic-btn-light cursor-pointer">
              <ImagePlus className="size-4" /> Substituir
              <input type="file" accept="image/jpeg,image/png" hidden onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await carregar(file, ativa);
                e.currentTarget.value = "";
              }} />
            </label>
            <button type="button" className="comic-btn-light" onClick={() => onExcluir(ativa.id)}><Trash2 className="size-4" /> Excluir</button>
          </div>
        </div>
      )}
    </div>
  );
}
