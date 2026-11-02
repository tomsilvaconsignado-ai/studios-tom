import type { PointerEvent as ReactPointerEvent } from "react";
import type { Enquadramento } from "@/lib/db";
import { ENQUADRAMENTO_ORIGINAL } from "@/lib/enquadramento";

export function ImagemPainel({ imagem, enquadramento = ENQUADRAMENTO_ORIGINAL, editar, onAlterar }: {
  imagem: string; enquadramento?: Enquadramento; editar?: boolean; onAlterar?: (v: Enquadramento) => void;
}) {
  const iniciar = (e: ReactPointerEvent<HTMLImageElement>) => {
    if (!editar || !onAlterar) return;
    e.preventDefault(); e.stopPropagation();
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const mover = (ev: PointerEvent) => onAlterar({ ...enquadramento,
      x: Math.max(-100, Math.min(100, enquadramento.x + (ev.clientX - e.clientX) / rect.width * 100)),
      y: Math.max(-100, Math.min(100, enquadramento.y + (ev.clientY - e.clientY) / rect.height * 100)) });
    const fim = () => { window.removeEventListener("pointermove", mover); window.removeEventListener("pointerup", fim); window.removeEventListener("pointercancel", fim); };
    window.addEventListener("pointermove", mover); window.addEventListener("pointerup", fim, { once: true }); window.addEventListener("pointercancel", fim, { once: true });
  };
  return <img src={imagem} alt="Imagem do painel" draggable={false} onPointerDown={iniciar}
    className={`absolute inset-0 h-full w-full touch-none ${editar ? "cursor-move" : "pointer-events-none"} ${enquadramento.ajuste === "preencher" ? "object-cover" : "object-contain"}`}
    style={{ transform: `translate(${enquadramento.x}%, ${enquadramento.y}%) scale(${enquadramento.zoom / 100})` }} />;
}