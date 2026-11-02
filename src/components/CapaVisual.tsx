import { RotateCw } from "lucide-react";
import { useRef, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { CamadaCapa } from "@/lib/db";

export function CapaVisual({ imagem, titulo, subtitulo, camadas = [], selecionada, editar, onSelecionar, onAlterar, onSoltarArquivos }: {
  imagem?: string | undefined; titulo: string; subtitulo: string; camadas?: CamadaCapa[] | undefined; selecionada?: string | null; editar?: boolean;
  onSelecionar?: (id: string | null) => void; onAlterar?: (id: string, patch: Partial<CamadaCapa>) => void;
  onSoltarArquivos?: (files: File[]) => void;
}) {
  const arrastar = (e: DragEvent) => { e.preventDefault(); if (e.dataTransfer.files.length) onSoltarArquivos?.([...e.dataTransfer.files]); };
  return (
    <div className="relative h-full w-full overflow-hidden bg-muted" onDragOver={(e) => e.preventDefault()} onDrop={arrastar} onPointerDown={() => onSelecionar?.(null)}>
      {imagem && <img src={imagem} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />}
      {camadas.length === 0 && <div className="pointer-events-none relative z-10 p-4"><span className="bg-foreground px-3 font-display text-5xl text-highlight">{titulo}</span>{subtitulo && <p className="mt-3 inline-block bg-card px-2 font-semibold">{subtitulo}</p>}</div>}
      {camadas.map((camada) => <ItemCapa key={camada.id} camada={camada} ativa={selecionada === camada.id} editar={Boolean(editar)} onSelecionar={() => onSelecionar?.(camada.id)} onAlterar={(p) => onAlterar?.(camada.id, p)} />)}
      {editar && camadas.length === 0 && !imagem && <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-muted-foreground">Arraste imagens, logos ou personagens para a capa</div>}
    </div>
  );
}

function ItemCapa({ camada, ativa, editar, onSelecionar, onAlterar }: { camada: CamadaCapa; ativa: boolean; editar: boolean; onSelecionar: () => void; onAlterar: (patch: Partial<CamadaCapa>) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const recortar = camada.tipo === "imagem" && camada.ajuste === "recortar";
  const iniciar = (e: ReactPointerEvent, modo: "mover" | "tamanho" | "girar") => {
    if (!editar || camada.bloqueada) return;
    e.preventDefault(); e.stopPropagation(); onSelecionar();
    const area = ref.current?.parentElement?.getBoundingClientRect(); if (!area) return;
    const ini = { px: e.clientX, py: e.clientY, x: camada.x, y: camada.y, w: camada.largura, r: camada.rotacao };
    const cx = area.left + area.width * camada.x / 100, cy = area.top + area.height * camada.y / 100;
    const ai = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
    const mover = (p: PointerEvent) => {
      if (modo === "mover") onAlterar({ x: snap(limitar(ini.x + (p.clientX - ini.px) / area.width * 100, 0, 100)), y: snap(limitar(ini.y + (p.clientY - ini.py) / area.height * 100, 0, 100)) });
      else if (modo === "tamanho") onAlterar({ largura: limitar(ini.w + (p.clientX - ini.px) / area.width * 100, 5, 180) });
      else onAlterar({ rotacao: Math.round(ini.r + Math.atan2(p.clientY - cy, p.clientX - cx) * 180 / Math.PI - ai) });
    };
    const fim = () => { window.removeEventListener("pointermove", mover); window.removeEventListener("pointerup", fim); };
    window.addEventListener("pointermove", mover); window.addEventListener("pointerup", fim, { once: true });
  };
  return <div ref={ref} className={`absolute z-20 touch-none ${editar && !camada.bloqueada ? "cursor-move" : "pointer-events-none"} ${ativa ? "outline outline-2 outline-ring" : ""}`}
    style={{ left: `${camada.x}%`, top: `${camada.y}%`, width: `${camada.largura}%`, opacity: camada.opacidade / 100, transform: `translate(-50%,-50%) rotate(${camada.rotacao}deg)` }}
    onPointerDown={(e) => iniciar(e, "mover")} onClick={(e) => { if (editar) { e.stopPropagation(); onSelecionar(); } }}>
    {camada.tipo === "imagem" && camada.imagem ? <div className={`w-full ${recortar ? "overflow-hidden" : "overflow-visible"}`}><img src={camada.imagem} alt={camada.nome} draggable={false} className="pointer-events-none block h-auto w-full object-contain" style={recortar ? { transform: `scale(${camada.zoom ?? 1})`, transformOrigin: `${camada.enquadramentoX ?? 50}% ${camada.enquadramentoY ?? 50}%` } : undefined} /></div>
      : <div className="flex h-full w-full items-center justify-center whitespace-pre-wrap text-center font-display leading-none" style={{ fontSize: `${camada.tamanhoFonte ?? 36}px`, color: camada.cor ?? "var(--foreground)" }}>{camada.texto}</div>}
    {ativa && !camada.bloqueada && <><button type="button" aria-label="Girar elemento" className="absolute left-1/2 top-0 flex size-6 -translate-x-1/2 -translate-y-8 items-center justify-center border-2 bg-card" onPointerDown={(e) => iniciar(e, "girar")}><RotateCw className="size-3" /></button><button type="button" aria-label="Redimensionar elemento" className="absolute bottom-0 right-0 size-4 translate-x-1/2 translate-y-1/2 border-2 bg-highlight" onPointerDown={(e) => iniciar(e, "tamanho")} /></>}
    {ativa && Math.abs(camada.x - 50) < 0.4 && <span className="pointer-events-none absolute bottom-[-200vh] left-1/2 top-[-200vh] border-l border-dashed border-primary" />}
  </div>;
}
const limitar = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const snap = (n: number) => Math.abs(n - 50) < 1.5 ? 50 : Math.round(n * 10) / 10;