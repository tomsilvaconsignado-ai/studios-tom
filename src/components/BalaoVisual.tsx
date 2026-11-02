import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CamadaImagem } from "@/lib/db";
import { pontoLocal } from "@/lib/baloes";

export function BalaoVisual({ camada, selecionada, interativa, onSelecionar, onAlterar }: {
  camada: CamadaImagem; selecionada: boolean; interativa: boolean;
  onSelecionar: () => void; onAlterar: (patch: Partial<CamadaImagem>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [editando, setEditando] = useState(false);
  const b = camada.balao;
  if (!b) return null;
  const iniciar = (e: ReactPointerEvent, modo: "mover" | "tamanho" | "girar" | "cauda") => {
    if (!interativa || (editando && modo === "mover")) return;
    e.preventDefault(); e.stopPropagation(); onSelecionar();
    const painel = ref.current?.parentElement;
    if (!painel) return;
    const rect = painel.getBoundingClientRect();
    const w = rect.width * camada.largura / 100, h = rect.height * b.altura / 100;
    const cx = rect.left + rect.width * camada.x / 100, cy = rect.top + rect.height * camada.y / 100;
    const angulo = Math.atan2(e.clientY - cy, e.clientX - cx);
    e.currentTarget.setPointerCapture(e.pointerId);
    const mover = (ev: PointerEvent) => {
      const dx = ev.clientX - e.clientX, dy = ev.clientY - e.clientY;
      if (modo === "mover") onAlterar({ x: Math.max(0, Math.min(100, camada.x + dx / rect.width * 100)), y: Math.max(0, Math.min(100, camada.y + dy / rect.height * 100)) });
      if (modo === "tamanho") {
        const local = pontoLocal(dx, dy, rect.width, rect.height, camada.rotacao);
        onAlterar({ largura: Math.max(8, Math.min(180, camada.largura + local.x * 2)), balao: { ...b, altura: Math.max(8, Math.min(180, b.altura + local.y * 2)) } });
      }
      if (modo === "girar") onAlterar({ rotacao: Math.round(camada.rotacao + (Math.atan2(ev.clientY - cy, ev.clientX - cx) - angulo) * 180 / Math.PI) });
      if (modo === "cauda") {
        const local = pontoLocal(ev.clientX - cx, ev.clientY - cy, w, h, camada.rotacao);
        onAlterar({ balao: { ...b, caudaX: Math.round(local.x + 50), caudaY: Math.round(local.y + 50) } });
      }
    };
    const terminar = () => { window.removeEventListener("pointermove", mover); window.removeEventListener("pointerup", terminar); window.removeEventListener("pointercancel", terminar); };
    window.addEventListener("pointermove", mover); window.addEventListener("pointerup", terminar, { once: true }); window.addEventListener("pointercancel", terminar, { once: true });
  };
  const dash = b.borda === "tracejada" ? "8 5" : b.borda === "pontilhada" ? "1 5" : undefined;
  const comum = { fill: b.fundo, stroke: b.corBorda, strokeWidth: b.espessura, strokeDasharray: dash, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const forma = () => {
    if (b.formato === "quadrado" || b.formato === "narracao") return <rect x="4" y="4" width="192" height="132" rx={b.formato === "narracao" ? 0 : 8} {...comum} />;
    if (b.formato === "grito") {
      const pontos = Array.from({ length: 40 }, (_, i) => { const a = i * Math.PI / 20; const raio = i % 2 ? 0.79 : 1; return `${100 + Math.cos(a) * 96 * raio},${70 + Math.sin(a) * 66 * raio}`; }).join(" ");
      return <polygon points={pontos} {...comum} />;
    }
    if (b.formato === "pensamento") return <path d="M 22 38 C 0 8 47 -4 65 14 C 83 -4 117 -2 133 13 C 159 -3 194 10 183 35 C 207 42 201 79 185 87 C 202 113 172 137 148 121 C 124 144 89 143 75 124 C 46 147 13 126 20 104 C -7 93 -2 53 22 38 Z" {...comum} />;
    if (b.formato === "irregular") return <path d="M 15 20 Q 48 0 99 8 Q 147 -2 183 18 L 194 58 L 184 118 Q 140 139 89 130 Q 43 143 12 113 L 5 69 Z" {...comum} />;
    return <ellipse cx="100" cy="70" rx="96" ry="66" {...comum} />;
  };
  const bx = b.baseX * 2, by = b.baseY * 1.4, tx = b.caudaX * 2, ty = b.caudaY * 1.4;
  const a = Math.atan2(ty - by, tx - bx), px = Math.sin(a) * b.larguraCauda, py = -Math.cos(a) * b.larguraCauda;
  return <div ref={ref} data-balao={camada.id}
    className={`balloon-layer absolute touch-none ${interativa ? "pointer-events-auto cursor-move" : "pointer-events-none"} ${selecionada ? "outline outline-2 outline-ring" : ""}`}
    style={{ left: `${camada.x}%`, top: `${camada.y}%`, width: `${camada.largura}%`, height: `${b.altura}%`, opacity: camada.opacidade / 100, transform: `translate(-50%, -50%) rotate(${camada.rotacao}deg)`, "--balloon-shadow-size": `${b.sombra}px` } as CSSProperties}
    onPointerDown={(e) => iniciar(e, "mover")} onClick={(e) => { if (interativa) { e.stopPropagation(); onSelecionar(); } }}
    onDoubleClick={(e) => { if (interativa) { e.stopPropagation(); setEditando(true); } }}>
    <svg viewBox="0 0 200 140" preserveAspectRatio="none" className="balloon-shape pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      {b.cauda && (b.formato === "pensamento" ? [0.4, 0.7, 1].map((t, i) => <ellipse key={i} cx={bx + (tx - bx) * t} cy={by + (ty - by) * t} rx={Math.max(3, b.larguraCauda * (1 - t * 0.7))} ry={Math.max(2, b.larguraCauda * (1 - t * 0.7) * 0.7)} {...comum} />) : <path d={`M ${bx + px} ${by + py} L ${tx} ${ty} L ${bx - px} ${by - py} Z`} {...comum} />)}
      {forma()}
    </svg>
    <div className={`balloon-text absolute inset-[18%] flex items-center ${b.efeito === "contorno" ? "balloon-text-outline" : ""}`}
      style={{ color: b.corTexto, fontFamily: b.fonte, fontSize: `${b.tamanhoFonte / 3}cqw`, fontWeight: b.negrito ? 700 : 400, fontStyle: b.italico ? "italic" : "normal", textAlign: b.alinhamento }}>
      {editando && selecionada && interativa ? <textarea autoFocus aria-label="Texto dentro do balão" className="h-full w-full resize-none bg-transparent text-inherit outline-none" value={b.texto}
        onPointerDown={(e) => e.stopPropagation()} onBlur={() => setEditando(false)} onChange={(e) => onAlterar({ nome: e.target.value.slice(0, 24) || "Balão", balao: { ...b, texto: e.target.value } })} /> : <span className="pointer-events-none w-full whitespace-pre-wrap break-words">{b.texto}</span>}
    </div>
    {selecionada && interativa && <>
      <Button variant="outline" size="icon" aria-label="Girar balão" title="Girar balão" className="absolute left-1/2 top-0 size-6 -translate-x-1/2 -translate-y-8 rounded-none" onPointerDown={(e) => iniciar(e, "girar")}><RotateCw /></Button>
      <Button variant="outline" size="icon" aria-label="Redimensionar balão" title="Redimensionar balão" className="absolute bottom-0 right-0 size-4 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-none bg-highlight" onPointerDown={(e) => iniciar(e, "tamanho")} />
      {b.cauda && <Button variant="outline" size="icon" aria-label="Apontar cauda" title="Apontar cauda" className="absolute size-4 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full bg-highlight" style={{ left: `${b.caudaX}%`, top: `${b.caudaY}%` }} onPointerDown={(e) => iniciar(e, "cauda")} />}
    </>}
  </div>;
}