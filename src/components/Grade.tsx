import { ImagePlus, RotateCw } from "lucide-react";
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { LAYOUTS, type CamadaImagem, type Pagina } from "@/lib/db";
import { BalaoVisual } from "@/components/BalaoVisual";
import { ImagemPainel } from "@/components/ImagemPainel";
import type { Enquadramento } from "@/lib/db";

export function Grade({ baloes, layout, quadros, mini, selecionado, onSelect, impressao, camadaSelecionada, onSelecionarCamada, onAlterarCamada, ajustarImagem, onEnquadramento }: {
  baloes?: CamadaImagem[]; impressao?: boolean; layout: string; quadros?: Pagina["quadros"]; mini?: boolean; selecionado?: number | null;
  onSelect?: (i: number) => void; camadaSelecionada?: string | null; onSelecionarCamada?: (id: string | null) => void;
  onAlterarCamada?: (id: string, patch: Partial<CamadaImagem>) => void;
  ajustarImagem?: boolean; onEnquadramento?: (i: number, v: Enquadramento) => void;
}) {
  const l = LAYOUTS.find((x) => x.id === layout) ?? LAYOUTS[4]!;
  const interativo = !mini && !impressao && Boolean(onAlterarCamada);
  return (
    <div className="relative h-full w-full">
    <div className={`grid h-full w-full ${mini ? "gap-0.5" : "gap-3"}`}
      style={{ gridTemplateColumns: `repeat(${l.cols}, 1fr)`, gridTemplateRows: `repeat(${l.rows}, 1fr)` }}>
      {l.areas.map((a, i) => {
        const q = quadros?.[i];
        return (
          <div key={i} data-quadro={i} style={{ gridArea: a }}
            onClick={onSelect ? () => onSelect(i) : undefined}
            className={`relative overflow-hidden bg-panel ${mini ? "border" : "cursor-pointer border-2"} ${selecionado === i ? "outline outline-4 outline-ring" : ""}`}>
            {q?.imagem && <ImagemPainel imagem={q.imagem} {...(q.enquadramento ? { enquadramento: q.enquadramento } : {})} editar={Boolean(!mini && !impressao && ajustarImagem && selecionado === i)} onAlterar={(v) => onEnquadramento?.(i, v)} />}
            {!mini && !impressao && !q?.imagem && (
              <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted-foreground">
                <ImagePlus className="size-5" />
                {q?.texto || "Quadro vazio"}
              </div>
            )}
            {!mini && q?.balao && (
              <div className="pointer-events-none absolute left-2 top-2 z-10 max-w-[80%] rounded-2xl border-2 bg-card px-3 py-1 text-sm font-semibold">{q.balao}</div>
            )}
            {q?.camadas?.map((camada) => {
              const Visual = camada.balao ? BalaoVisual : Camada;
              return <Visual
                key={camada.id}
                camada={camada}
                selecionada={!mini && !impressao && camadaSelecionada === camada.id}
                interativa={!mini && !impressao && Boolean(onAlterarCamada)}
                onSelecionar={() => { onSelect?.(i); onSelecionarCamada?.(camada.id); }}
                onAlterar={(patch) => onAlterarCamada?.(camada.id, patch)}
              />;
            })}
          </div>
        );
      })}
    </div>
    {Boolean(baloes?.length) && (
      <div data-camada-baloes className="pointer-events-none absolute inset-0 z-20 overflow-visible">
        {baloes!.map((camada) => <BalaoVisual key={camada.id} camada={camada}
          selecionada={interativo && camadaSelecionada === camada.id} interativa={interativo}
          onSelecionar={() => onSelecionarCamada?.(camada.id)} onAlterar={(patch) => onAlterarCamada?.(camada.id, patch)} />)}
      </div>
    )}
    </div>
  );
}

function Camada({ camada, selecionada, interativa, onSelecionar, onAlterar }: {
  camada: CamadaImagem; selecionada: boolean; interativa: boolean; onSelecionar: () => void;
  onAlterar: (patch: Partial<CamadaImagem>) => void;
}) {
  const elemento = useRef<HTMLDivElement>(null);

  const iniciar = (e: ReactPointerEvent, modo: "mover" | "tamanho" | "girar") => {
    if (!interativa) return;
    e.preventDefault(); e.stopPropagation(); onSelecionar();
    const painel = elemento.current?.parentElement;
    if (!painel) return;
    const rect = painel.getBoundingClientRect();
    const inicio = { px: e.clientX, py: e.clientY, x: camada.x, y: camada.y, largura: camada.largura, rotacao: camada.rotacao };
    const centroX = rect.left + (camada.x / 100) * rect.width;
    const centroY = rect.top + (camada.y / 100) * rect.height;
    const anguloInicial = Math.atan2(e.clientY - centroY, e.clientX - centroX) * 180 / Math.PI;
    e.currentTarget.setPointerCapture(e.pointerId);
    const mover = (ev: PointerEvent) => {
      if (modo === "mover") {
        onAlterar({
          x: limitar(inicio.x + ((ev.clientX - inicio.px) / rect.width) * 100, 0, 100),
          y: limitar(inicio.y + ((ev.clientY - inicio.py) / rect.height) * 100, 0, 100),
        });
      } else if (modo === "tamanho") {
        onAlterar({ largura: limitar(inicio.largura + ((ev.clientX - inicio.px) / rect.width) * 100, 5, 180) });
      } else {
        const angulo = Math.atan2(ev.clientY - centroY, ev.clientX - centroX) * 180 / Math.PI;
        onAlterar({ rotacao: Math.round(inicio.rotacao + angulo - anguloInicial) });
      }
    };
    const terminar = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", terminar);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", terminar, { once: true });
  };

  return (
    <div
      ref={elemento}
      className={`absolute touch-none ${interativa ? "cursor-move" : "pointer-events-none"} ${selecionada ? "outline outline-2 outline-ring" : ""}`}
      style={{ left: `${camada.x}%`, top: `${camada.y}%`, width: `${camada.largura}%`, aspectRatio: camada.proporcao,
        opacity: camada.opacidade / 100, transform: `translate(-50%, -50%) rotate(${camada.rotacao}deg)` }}
      onPointerDown={(e) => iniciar(e, "mover")}
      onClick={(e) => { if (interativa) { e.stopPropagation(); onSelecionar(); } }}
    >
      <img src={camada.imagem} alt={camada.nome} draggable={false} className="pointer-events-none h-full w-full object-contain" />
      {selecionada && (
        <>
          <button type="button" aria-label="Girar camada" title="Girar camada" className="absolute left-1/2 top-0 flex size-6 -translate-x-1/2 -translate-y-8 cursor-grab items-center justify-center border-2 bg-card" onPointerDown={(e) => iniciar(e, "girar")}>
            <RotateCw className="size-3.5" />
          </button>
          <button type="button" aria-label="Redimensionar camada" title="Redimensionar camada" className="absolute bottom-0 right-0 size-4 translate-x-1/2 translate-y-1/2 cursor-nwse-resize border-2 bg-highlight" onPointerDown={(e) => iniciar(e, "tamanho")} />
        </>
      )}
    </div>
  );
}

const limitar = (valor: number, min: number, max: number) => Math.min(max, Math.max(min, valor));

