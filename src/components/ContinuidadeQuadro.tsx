import { useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Link2, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import type { ContextoCena, DadosRevista, Personagem, Quadro } from "@/lib/db";
import { analisarCena, verificarContinuidade } from "@/lib/continuidade.functions";
import { NIVEIS, contextoEmTexto, fichasEmTexto, memoriaDaCena, promptContinuidade, type NivelContinuidade } from "@/lib/continuidade";

type Problema = { mensagem: string; manter: string; alterar: string; escolha?: "manter" | "alterar" };

export function ContinuidadeQuadro({ dados, paginaId, quadro, personagens, promptBase, onConfig, onMudancas, onContexto, children }: {
  dados: DadosRevista; paginaId: string; quadro: Quadro; personagens: Personagem[]; promptBase: () => string;
  onConfig: (c: { ativa: boolean; nivel: NivelContinuidade }) => void;
  onMudancas: (m: string[]) => void;
  onContexto: (ctx: ContextoCena) => void;
  children: (api: { preparar: () => Promise<{ prompt: string; refs: string[] } | null>; aposGerar: (img: string) => void }) => ReactNode;
}) {
  const cfg = dados.continuidade ?? { ativa: true, nivel: "alta" as NivelContinuidade };
  const [problemas, setProblemas] = useState<Problema[] | null>(null);
  const [verificadoPara, setVerificadoPara] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [analisando, setAnalisando] = useState(false);
  const fichas = fichasEmTexto(personagens);
  const chave = `${quadro.texto}|${cfg.nivel}`;

  async function verificar() {
    const mem = memoriaDaCena(dados, paginaId, quadro.id, cfg.nivel);
    if (!mem.texto) { setProblemas([]); setVerificadoPara(chave); return []; }
    setVerificando(true);
    try {
      const r = await verificarContinuidade({ data: { contextos: mem.texto.slice(0, 20000), descricao: quadro.texto, fichas: fichas.slice(0, 8000), ...(mem.imagens[0] ? { imagem: mem.imagens[0] } : {}) } });
      setProblemas(r.problemas); setVerificadoPara(chave);
      return r.problemas;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível verificar.");
      return null;
    } finally { setVerificando(false); }
  }

  const decisoes = (problemas ?? []).filter((p) => p.escolha).map((p) => (p.escolha === "manter" ? p.manter : p.alterar));
  const pendentes = (problemas ?? []).filter((p) => !p.escolha).length;

  async function preparar() {
    const base = promptBase();
    if (!cfg.ativa) return { prompt: base, refs: [] };
    let lista: Problema[] | null = problemas;
    if (verificadoPara !== chave) lista = await verificar();
    if (lista === null) return null;
    if (lista.some((p) => !p.escolha)) { toast.warning("Possível inconsistência: escolha manter ou alterar antes de gerar."); return null; }
    const mem = memoriaDaCena(dados, paginaId, quadro.id, cfg.nivel);
    const decs = lista.filter((p) => p.escolha).map((p) => (p.escolha === "manter" ? p.manter : p.alterar));
    onMudancas(lista.filter((p) => p.escolha === "alterar").map((p) => p.alterar));
    return { prompt: [base, promptContinuidade(mem.texto, decs, mem.imagens.length > 0, cfg.nivel)].filter(Boolean).join("\n\n"), refs: mem.imagens };
  }

  async function aposGerar(img: string) {
    setAnalisando(true);
    try {
      const mem = memoriaDaCena(dados, paginaId, quadro.id, "baixa");
      const ctx = await analisarCena({ data: { imagem: img, descricao: [quadro.texto, ...decisoes].join(". ").slice(0, 4000), fichas: fichas.slice(0, 8000), anterior: mem.texto.slice(0, 12000) } });
      onContexto(ctx);
    } catch { toast.error("A imagem foi criada, mas a memória da cena não foi salva."); }
    setAnalisando(false);
  }

  return (
    <div className="space-y-2">
      <div className="space-y-2 border-2 bg-card p-2">
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={cfg.ativa} onChange={(e) => onConfig({ ...cfg, ativa: e.target.checked })} />
          <Link2 className="size-4" /> Manter continuidade com painel anterior
        </label>
        {cfg.ativa && (
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="font-semibold">Nível:</span>
            {NIVEIS.map((n) => (
              <label key={n.id} className="flex items-center gap-1">
                <input type="radio" name={`nivel-${quadro.id}`} checked={cfg.nivel === n.id} onChange={() => onConfig({ ...cfg, nivel: n.id })} /> {n.nome}
              </label>
            ))}
          </div>
        )}
        <button className="comic-btn-light w-full justify-center text-sm" onClick={verificar} disabled={verificando}>
          <ScanSearch className="size-4" /> {verificando ? "Verificando…" : "Verificar continuidade"}
        </button>
        {problemas && problemas.length === 0 && verificadoPara === chave && (
          <p className="flex items-center gap-1 text-xs font-semibold"><CheckCircle2 className="size-4" /> Nenhuma inconsistência encontrada.</p>
        )}
        {problemas && problemas.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-bold">Possível inconsistência{pendentes ? ` (${pendentes} pendente${pendentes > 1 ? "s" : ""})` : ""}</p>
            {problemas.map((p, i) => (
              <div key={i} className="space-y-1 border-2 bg-secondary p-2 text-xs">
                <p className="flex gap-1 font-semibold"><AlertTriangle className="size-4 shrink-0 text-destructive" /> {p.mensagem}</p>
                <div className="flex gap-1">
                  {(["manter", "alterar"] as const).map((op) => (
                    <button key={op} className={`flex-1 border-2 px-2 py-1 font-bold ${p.escolha === op ? "bg-primary text-primary-foreground" : "bg-card"}`}
                      onClick={() => setProblemas((ps) => ps!.map((x, j) => (j === i ? { ...x, escolha: op } : x)))}>
                      {op === "manter" ? "Manter continuidade" : "Alterar"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {analisando && <p className="text-xs text-muted-foreground">Salvando memória da cena…</p>}
        {!analisando && quadro.contexto && <details className="text-xs"><summary className="cursor-pointer font-semibold">Memória deste painel</summary><pre className="whitespace-pre-wrap">{contextoEmTexto(quadro.contexto)}</pre></details>}
      </div>
      {children({ preparar, aposGerar })}
    </div>
  );
}
